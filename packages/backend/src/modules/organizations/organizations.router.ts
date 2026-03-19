import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares';
import { UserRole } from '@prisma/client';
import * as orgController from './organizations.controller';

const router = Router();

// All org routes require authentication
router.use(authenticate);

router.get('/', orgController.getOrganization);
router.put('/', authorize(UserRole.OWNER, UserRole.ADMIN), orgController.updateOrganization);

router.get('/members', orgController.getMembers);
router.put('/members/:id', authorize(UserRole.OWNER, UserRole.ADMIN), orgController.updateMemberRole);
router.delete('/members/:id', authorize(UserRole.OWNER, UserRole.ADMIN), orgController.removeMember);

router.get('/invitations', authorize(UserRole.OWNER, UserRole.ADMIN), orgController.getInvitations);
router.post('/invitations', authorize(UserRole.OWNER, UserRole.ADMIN), orgController.createInvitation);
router.delete('/invitations/:id', authorize(UserRole.OWNER, UserRole.ADMIN), orgController.deleteInvitation);
router.post('/invitations/accept/:token', orgController.acceptInvitation);

export { router as organizationsRouter };
