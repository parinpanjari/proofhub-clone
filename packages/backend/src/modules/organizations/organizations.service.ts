import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config';
import { AppError } from '../../middlewares';
import type { UpdateOrgInput, InviteInput, PaginationInput } from './organizations.schema';

export async function getOrganization(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: { users: true, projects: true, teams: true },
      },
    },
  });

  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  return {
    ...org,
    storageUsedBytes: org.storageUsedBytes.toString(),
    memberCount: org._count.users,
    projectCount: org._count.projects,
    teamCount: org._count.teams,
  };
}

export async function updateOrganization(orgId: string, input: UpdateOrgInput) {
  if (input.customDomain) {
    const existing = await prisma.organization.findUnique({
      where: { customDomain: input.customDomain },
    });
    if (existing && existing.id !== orgId) {
      throw new AppError('Custom domain already in use', 409);
    }
  }

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: input,
  });

  return org;
}

export async function getMembers(orgId: string, pagination: PaginationInput) {
  const { page, limit, search } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    organizationId: orgId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    members,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateMemberRole(orgId: string, memberId: string, role: UserRole, requestingUserId: string) {
  const member = await prisma.user.findFirst({
    where: { id: memberId, organizationId: orgId },
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (member.role === UserRole.OWNER) {
    throw new AppError('Cannot change the role of the organization owner', 403);
  }

  if (memberId === requestingUserId) {
    throw new AppError('Cannot change your own role', 400);
  }

  const updated = await prisma.user.update({
    where: { id: memberId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
    },
  });

  return updated;
}

export async function removeMember(orgId: string, memberId: string, requestingUserId: string) {
  const member = await prisma.user.findFirst({
    where: { id: memberId, organizationId: orgId },
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (member.role === UserRole.OWNER) {
    throw new AppError('Cannot remove the organization owner', 403);
  }

  if (memberId === requestingUserId) {
    throw new AppError('Cannot remove yourself', 400);
  }

  await prisma.user.update({
    where: { id: memberId },
    data: { organizationId: null, isActive: false },
  });
}

export async function getInvitations(orgId: string) {
  const invitations = await prisma.invitation.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
  });

  return invitations;
}

export async function createInvitation(orgId: string, input: InviteInput) {
  const existingUser = await prisma.user.findFirst({
    where: { email: input.email, organizationId: orgId },
  });

  if (existingUser) {
    throw new AppError('User is already a member of this organization', 409);
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: { orgId, email: input.email, status: 'PENDING' },
  });

  if (existingInvite) {
    throw new AppError('An invitation has already been sent to this email', 409);
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { _count: { select: { users: true } } },
  });

  if (org && org._count.users >= org.maxUsers) {
    throw new AppError('Organization has reached maximum user limit', 403);
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      orgId,
      email: input.email,
      role: input.role,
      token,
      expiresAt,
    },
  });

  // TODO: Send email invitation via Nodemailer
  console.log(`Invitation created for ${input.email}, token: ${token}`);

  return invitation;
}

export async function deleteInvitation(orgId: string, invitationId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, orgId },
  });

  if (!invitation) {
    throw new AppError('Invitation not found', 404);
  }

  await prisma.invitation.delete({ where: { id: invitationId } });
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) {
    throw new AppError('Invalid invitation token', 400);
  }

  if (invitation.status !== 'PENDING') {
    throw new AppError('Invitation has already been used or expired', 400);
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    throw new AppError('Invitation has expired', 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: invitation.orgId,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    }),
  ]);
}
