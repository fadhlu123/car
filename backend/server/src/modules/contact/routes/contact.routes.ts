import { Router, type Router as RouterType } from 'express';
import { protect, adminProtect } from '../../auth/middleware/auth.middleware';
import * as userCtrl  from '../controllers/contact.controller';
import * as adminCtrl from '../controllers/admin.contact.controller';

const router: RouterType = Router();

// ─── Customer (account required — no guest chat) ───────────────────────────────
router.get(   '/contact/conversation',              protect, userCtrl.getConversation);
router.post(  '/contact/conversation/messages',     protect, ...userCtrl.postMessage);
router.patch( '/contact/conversation/messages/:id', protect, ...userCtrl.editMessage);
router.post(  '/contact/conversation/seen',         protect, userCtrl.markSeen);

// ─── Admin (shared inbox — any admin/staff can view and reply) ────────────────
router.get(  '/admin/contact/conversations',              adminProtect, ...adminCtrl.listConversations);
router.get(  '/admin/contact/conversations/:id',          adminProtect, adminCtrl.getConversation);
router.post( '/admin/contact/conversations/:id/messages', adminProtect, ...adminCtrl.postReply);
router.post( '/admin/contact/conversations/:id/seen',     adminProtect, adminCtrl.markSeen);

export default router;
