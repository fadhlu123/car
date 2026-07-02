import { Router, type Router as RouterType } from 'express';
import rateLimit from 'express-rate-limit';
import {
  protect,
  adminProtect,
  ownerProtect,
} from '../../auth/middleware/auth.middleware';
import * as adminUsers  from '../controllers/admin.users.controller';
import * as adminTeam   from '../controllers/admin.team.controller';
import * as profile     from '../controllers/user.profile.controller';
import * as adminProfile from '../controllers/admin.profile.controller';

const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many invite attempts. Please try again later.', data: null },
});

const router: RouterType = Router();

// ── User self-service ─────────────────────────────────────────────────────────
router.get(  '/user/profile',        protect, profile.getProfile);
router.patch('/user/profile',        protect, ...profile.updateProfile);
router.post( '/user/profile/avatar', protect, ...profile.updateAvatar);

// ── Admin self-service (own account — an admin is a User document too) ───────
router.get(  '/admin/profile',        adminProtect, adminProfile.getProfile);
router.patch('/admin/profile',        adminProtect, ...adminProfile.updateProfile);
router.post( '/admin/profile/avatar', adminProtect, ...adminProfile.updateAvatar);

// ── Admin — user management (any admin) ──────────────────────────────────────
router.get(  '/admin/users',                 adminProtect, ...adminUsers.listUsers);
router.get(  '/admin/users/:id',             adminProtect, ...adminUsers.getUserDetail);
router.patch('/admin/users/:id/unlock',      ownerProtect, ...adminUsers.unlockAccount);
router.patch('/admin/users/:id/deactivate',  ownerProtect, ...adminUsers.deactivateAccount);
router.patch('/admin/users/:id/activate',    ownerProtect, ...adminUsers.activateAccount);

// ── Admin — team management (owner only) ─────────────────────────────────────
router.get(   '/admin/team',                  adminProtect, adminTeam.listTeam);
router.post(  '/admin/team/invite',           ownerProtect, inviteLimiter, ...adminTeam.inviteAdmin);
router.delete('/admin/team/:id',              ownerProtect, ...adminTeam.removeFromTeam);
router.delete('/admin/team/invites/:id',      ownerProtect, ...adminTeam.revokeInvite);

// ── Public — invite acceptance (no auth required) ────────────────────────────
// GET  lets the frontend show "You were invited by X" before the user commits
router.get( '/admin/invite/:token',           ...adminTeam.getInviteInfo);
router.post('/admin/invite/accept',           inviteLimiter, ...adminTeam.acceptInvite);

export default router;
