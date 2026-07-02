import { Router, type Router as RouterType } from 'express';
import { adminProtect } from '../../auth/middleware/auth.middleware';
import * as publicCtrl from '../controllers/content.controller';
import * as adminCtrl  from '../controllers/admin.content.controller';

const router: RouterType = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/content/about',        publicCtrl.getAbout);
router.get('/content/contact-info', publicCtrl.getContactInfo);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get(   '/admin/content/about/blocks',     adminProtect, adminCtrl.listBlocks);
router.post(  '/admin/content/about/blocks',     adminProtect, ...adminCtrl.addBlock);
router.patch( '/admin/content/about/blocks/:id', adminProtect, ...adminCtrl.updateBlock);
router.patch( '/admin/content/about/reorder',    adminProtect, ...adminCtrl.reorderBlocks);
router.delete('/admin/content/about/blocks/:id', adminProtect, adminCtrl.deleteBlock);
router.put(   '/admin/content/contact-info',     adminProtect, ...adminCtrl.updateContactInfo);

export default router;
