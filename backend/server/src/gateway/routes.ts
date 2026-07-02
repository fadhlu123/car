import { Router, type Router as RouterType } from 'express';

const router: RouterType = Router();

// Phase 1 — Auth (register, login, OAuth, sessions, password management)
import authRouter from '../modules/auth/routes/auth.routes';
router.use('/auth', authRouter);

// Phase 2 — User account management + Admin team management
import usersRouter from '../modules/users/routes/users.routes';
router.use('/', usersRouter);

// Phase 3 — Inventory / Products
import inventoryRouter from '../modules/inventory/routes/inventory.routes';
router.use('/', inventoryRouter);

// Phase 4 — Orders
import ordersRouter from '../modules/orders/routes/orders.routes';
router.use('/', ordersRouter);

// Phase 5 — Notifications (in-app, SSE, email, broadcasts)
import notificationsRouter from '../modules/notifications/routes/notifications.routes';
router.use('/', notificationsRouter);

// Contact Us chat (customer <-> admin messaging)
import contactRouter from '../modules/contact/routes/contact.routes';
router.use('/', contactRouter);

// Site content (About Us CMS + Contact info)
import contentRouter from '../modules/content/routes/content.routes';
router.use('/', contentRouter);

export default router;
