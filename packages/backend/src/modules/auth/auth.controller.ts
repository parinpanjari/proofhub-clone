import { Request, Response, NextFunction } from 'express';
import { env } from '../../config';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.schema';
import * as authService from './auth.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
      message: 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (req.user && refreshToken) {
      await authService.logout(req.user.userId, refreshToken);
    }

    res.clearCookie('refreshToken', { path: '/' });

    res.json({
      success: true,
      data: null,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token not found' });
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: { accessToken: result.accessToken },
      message: 'Token refreshed',
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);

    res.json({
      success: true,
      data: null,
      message: 'If the email exists, a reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;
    const { password } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);

    res.json({
      success: true,
      data: null,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.userId);

    res.json({
      success: true,
      data: user,
      message: 'User profile retrieved',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user!.userId, input);

    res.json({
      success: true,
      data: user,
      message: 'Profile updated',
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.userId, input);

    res.json({
      success: true,
      data: null,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}
