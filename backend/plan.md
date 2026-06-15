# Build Plan

Phased build order for `backend/server`. Each phase should be runnable/testable end-to-end before moving to the next — don't build inventory before auth works, don't build orders before inventory exists, etc.

---

## Phase 0 — Project skeleton

- `package.json`, `tsconfig.json`, dev scripts (`dev`, `build`, `start`).
- `configs/env.config.ts` — load & validate env vars (PORT, MONGODB_URI, JWT_SECRET, Cloudinary creds, email creds).
- `configs/database.config.ts` — MongoDB connection (Mongoose).
- `configs/cors.config.ts`, `configs/helmet.config.ts` — basic security/middleware setup.
- `utils/error.utils.ts` — `AppError` class + global error-handling middleware.
- `utils/response.utils.ts` — standard `{ success, data, message }` response helper.
- `utils/logger.utils.ts` — request/error logging.
- `app.ts` — wire up express app (middleware, error handler, health-check route).
- `server.ts` — bootstrap (connect DB, start HTTP server).
- `gateway/index.ts` + `gateway/routes.ts` — empty router mount point, ready for modules.

**Done when:** server starts, connects to MongoDB, and `GET /health` returns a standard success response.

---

## Phase 1 — Auth (admin)

- `User` model: name, email, password (hashed), role (`admin` — single role for now, but keep the field for future staff roles).
- `utils/crypto.utils.ts` — password hashing/compare, JWT sign/verify.
- Routes: `POST /api/auth/login`, `GET /api/auth/profile` (protected).
- `authMiddleware` — verifies JWT, attaches `req.user`.
- Seed script — create the initial admin user from env vars or a one-off script.

**Done when:** admin can log in and get a JWT, and `/api/auth/profile` returns their info with a valid token; without a token it's rejected.

---

## Phase 2 — Users (admin account management)

- Routes under `/admin/users`: list admins/staff, update own profile, change password.
- Keep it minimal — if this gig only ever has one admin, this phase can just be "change password" + "update profile". Don't build multi-staff management unless it's actually needed.

**Done when:** admin can view and update their own account details and password.

---

## Phase 3 — Inventory (products)

- `Product` model: name, description, price, stock/availability, category, images (array of Cloudinary URLs), createdAt.
- `configs/cloudinary.configs.ts` + `utils/cloudinary.utils.ts` — image upload helper.
- Public routes: `GET /api/products` (list + filter/search), `GET /api/products/:id`.
- Admin routes: `POST /admin/products` (with image upload), `PUT /admin/products/:id`, `DELETE /admin/products/:id`.

**Done when:** admin can create/update/delete products with images via Cloudinary, and the public API returns them correctly.

---

## Phase 4 — Orders (+ cart on the frontend)

- Cart stays client-side (local storage) — no backend cart model needed.
- `Order` model: items (productId, name snapshot, price snapshot, quantity), customer contact info (name, phone, email, notes), status (`Pending` / `Contacted` / `Completed` / `Cancelled`), createdAt.
- Public route: `POST /api/orders` — customer submits cart + contact info, no auth required.
- Admin routes: `GET /admin/orders`, `GET /admin/orders/:id`, `PUT /admin/orders/:id` (update status).

**Done when:** a customer can submit an order from their cart, and the admin can view it and update its status.

---

## Phase 5 — Notifications

- `utils/email.utils.ts` — send email via chosen provider (e.g. SMTP/Resend/Nodemailer).
- On new order: email the admin with order details. Optionally send a confirmation email to the customer if they provided an email.
- Keep it synchronous/simple for v1 — no queue needed at this scale.

**Done when:** admin receives an email notification whenever a new order is created.

---

## Phase 6 — Frontend integration

- Wire up `frontend/app` to the real API: product listing/detail pages, local-storage cart, checkout form (submits to `/api/orders`).
- Admin dashboard: login, inventory CRUD + image upload UI, orders list with status updates.

**Done when:** full flow works end-to-end in the browser — browse products, add to cart, checkout, admin sees and manages the order.

---

## Future / out of scope for this gig

- Payments / online checkout.
- Customer accounts, order history per customer.
- Reviews, wishlists, multi-vendor.
- Real-time admin notifications (Socket.io) — re-add from template if needed later.
- Caching/sessions (Redis) — re-add from template if needed later.
