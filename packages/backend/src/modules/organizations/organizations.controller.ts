import { Request, Response, NextFunction } from 'express';
import {
  updateOrgSchema,
  updateMemberRoleSchema,
  inviteSchema,
  paginationSchema,
} from './organizations.schema';
import * as orgService from './organizations.service';

export async function getOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const org = await orgService.getOrganization(req.user!.orgId);
    res.json({ success: true, data: org, message: 'Organization retrieved' });
  } catch (error) {
    next(error);
  }
}

export async function updateOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateOrgSchema.parse(req.body);
    const org = await orgService.updateOrganization(req.user!.orgId, input);
    res.json({ success: true, data: org, message: 'Organization updated' });
  } catch (error) {
    next(error);
  }
}

export async function getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pagination = paginationSchema.parse(req.query);
    const result = await orgService.getMembers(req.user!.orgId, pagination);
    res.json({ success: true, data: result.members, pagination: result.pagination, message: 'Members retrieved' });
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = updateMemberRoleSchema.parse(req.body);
    const member = await orgService.updateMemberRole(
      req.user!.orgId,
      req.params.id,
      role,
      req.user!.userId
    );
    res.json({ success: true, data: member, message: 'Member role updated' });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await orgService.removeMember(req.user!.orgId, req.params.id, req.user!.userId);
    res.json({ success: true, data: null, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
}

export async function getInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invitations = await orgService.getInvitations(req.user!.orgId);
    res.json({ success: true, data: invitations, message: 'Invitations retrieved' });
  } catch (error) {
    next(error);
  }
}

export async function createInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = inviteSchema.parse(req.body);
    const invitation = await orgService.createInvitation(req.user!.orgId, input);
    res.status(201).json({ success: true, data: invitation, message: 'Invitation sent' });
  } catch (error) {
    next(error);
  }
}

export async function deleteInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await orgService.deleteInvitation(req.user!.orgId, req.params.id);
    res.json({ success: true, data: null, message: 'Invitation deleted' });
  } catch (error) {
    next(error);
  }
}

export async function acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await orgService.acceptInvitation(req.params.token, req.user!.userId);
    res.json({ success: true, data: null, message: 'Invitation accepted' });
  } catch (error) {
    next(error);
  }
}
