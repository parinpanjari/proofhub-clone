import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  logo: z.string().url().optional().nullable(),
  customDomain: z.string().max(255).optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole).default(UserRole.MEMBER),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
