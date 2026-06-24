import { Router, type Router as RouterType } from 'express';
import { adminProtect } from '../../auth/middleware/auth.middleware';
import * as publicCtrl from '../controllers/product.controller';
import * as adminCtrl  from '../controllers/admin.product.controller';

const router: RouterType = Router();

// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/products',     publicCtrl.listProducts);
router.get('/products/:id', publicCtrl.getProduct);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get(   '/admin/products',                    adminProtect, ...adminCtrl.listAllProducts);
router.get(   '/admin/products/:id',                adminProtect, adminCtrl.getProductAdmin);
router.post(  '/admin/products',                    adminProtect, ...adminCtrl.createProduct);
router.patch( '/admin/products/:id',                adminProtect, ...adminCtrl.updateProduct);
router.post(  '/admin/products/:id/images',         adminProtect, ...adminCtrl.addImages);
router.delete('/admin/products/:id/images/:imageId',adminProtect, adminCtrl.removeImage);
router.delete('/admin/products/:id',                adminProtect, adminCtrl.deleteProduct);

export default router;
