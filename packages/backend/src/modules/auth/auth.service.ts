import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@prisma/client';
import { prisma, env, redis } from '../../config';
import { AppError } from '../../middlewares';
import type { JwtPayload } from '../../middlewares';
import type {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from './auth.schema';

const REFRESH_TOKEN_PREFIX = 'refresh:';
const BLACKLIST_PREFIX = 'blacklist:';
const RESET_TOKEN_PREFIX = 'reset:';

// Safe Redis helpers — gracefully handle when Redis is unavailable
async function safeRedisSet(key: string, value: string, mode?: string, duration?: number): Promise<void> {
  try {
    if (mode === 'EX' && duration) {
      await redis.set(key, value, 'EX', duration);
    } else {
      await redis.set(key, value);
    }
  } catch {
    console.warn('Redis set failed (non-fatal), key:', key);
  }
}

async function safeRedisGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch {
    console.warn('Redis get failed (non-fatal), key:', key);
    return null;
  }
}

async function safeRedisDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    console.warn('Redis del failed (non-fatal), key:', key);
  }
}

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

function parseExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  switch (unit) {
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

export async function register(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: input.organizationName,
      },
    });

    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: UserRole.OWNER,
        organizationId: org.id,
        lastLogin: new Date(),
      },
    });

    return { user, org };
  });

  const jwtPayload: JwtPayload = {
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
    orgId: result.org.id,
  };

  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  await safeRedisSet(
    `${REFRESH_TOKEN_PREFIX}${result.user.id}`,
    refreshToken,
    'EX',
    parseExpiry(env.JWT_REFRESH_EXPIRES_IN)
  );

  return {
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      avatar: result.user.avatar,
      timezone: result.user.timezone,
      organizationId: result.org.id,
    },
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { organization: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    orgId: user.organizationId ?? '',
  };

  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  await safeRedisSet(
    `${REFRESH_TOKEN_PREFIX}${user.id}`,
    refreshToken,
    'EX',
    parseExpiry(env.JWT_REFRESH_EXPIRES_IN)
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      timezone: user.timezone,
      organizationId: user.organizationId,
    },
    accessToken,
    refreshToken,
  };
}

export async function logout(userId: string, refreshToken: string): Promise<void> {
  await safeRedisDel(`${REFRESH_TOKEN_PREFIX}${userId}`);

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { exp: number };
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await safeRedisSet(`${BLACKLIST_PREFIX}${refreshToken}`, '1', 'EX', ttl);
    }
  } catch {
    // Token already expired — no need to blacklist
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const isBlacklisted = await safeRedisGet(`${BLACKLIST_PREFIX}${refreshToken}`);
  if (isBlacklisted) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const storedToken = await safeRedisGet(`${REFRESH_TOKEN_PREFIX}${decoded.userId}`);
  if (storedToken && storedToken !== refreshToken) {
    throw new AppError('Refresh token mismatch', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    orgId: user.organizationId ?? '',
  };

  const newAccessToken = generateAccessToken(jwtPayload);

  return { accessToken: newAccessToken };
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal whether email exists
    return;
  }

  const resetToken = uuidv4();
  await safeRedisSet(`${RESET_TOKEN_PREFIX}${resetToken}`, user.id, 'EX', 3600); // 1 hour

  // TODO: Send email with reset link in Phase 2+
  console.log(`Password reset token for ${email}: ${resetToken}`);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const userId = await safeRedisGet(`${RESET_TOKEN_PREFIX}${token}`);
  if (!userId) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await safeRedisDel(`${RESET_TOKEN_PREFIX}${token}`);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      timezone: true,
      isActive: true,
      lastLogin: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      timezone: true,
      organizationId: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const validPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!validPassword) {
    throw new AppError('Current password is incorrect', 400);
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
