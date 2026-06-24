import { Router, type Router as RouterType } from 'express';
import { optionalProtect, protect, adminProtect } from '../../auth/middleware/auth.middleware';
import * as publicCtrl from '../controllers/order.controller';
import * as adminCtrl  from '../controllers/admin.order.controller';

const router: RouterType = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
// optionalProtect attaches req.user if a valid token is present — guest orders work too
router.post('/orders', optionalProtect, ...publicCtrl.submitOrder);

// ─── Logged-in customer: own order history ───────────────────────────────────
router.get('/orders/mine', protect, ...publicCtrl.getMyOrders);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get(  '/admin/orders',          adminProtect, ...adminCtrl.listOrders);
router.get(  '/admin/orders/:id',      adminProtect, adminCtrl.getOrder);
router.patch('/admin/orders/:id/status', adminProtect, ...adminCtrl.updateOrderStatus);

export default router;
