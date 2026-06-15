# Backend Template (Ecommerce)

This is a reusable backend template intended to be copied into a new repo for each client/gig, rather than run as a shared multi-tenant service. Each client gets their own isolated codebase, database, and credentials — a breach or bug in one client's instance can't affect another's.

> **Status:** scaffold stage. The folder/file structure below has been laid out as placeholders; implementation is in progress.

## Stack

- **Node.js + TypeScript + Express**
- **MongoDB** (via `configs/database.config.ts`)
- **Cloudinary** for image uploads (product/inventory photos)
- **Helmet + CORS** for baseline security headers

> Redis and Socket.io were considered but stripped from this gig — no caching/session or real-time-push requirement. Add them back from the template if a future gig needs them.

## Folder structure

```
src/
  app.ts                  # Express app setup (middleware, route mounting)
  server.ts               # Entry point / HTTP server bootstrap
  configs/
    cors.config.ts
    database.config.ts
    env.config.ts
    helmet.config.ts
    cloudinary.configs.ts
  gateway/
    index.ts               # aggregates and mounts all module routers
    routes.ts               # top-level route map
  utils/
    crypto.utils.ts         # password hashing, token helpers
    email.utils.ts          # transactional email sending
    error.utils.ts           # error classes / error handler
    logger.utils.ts
    request.utils.ts
    response.utils.ts        # standard success/error response shape
```

## Conventions

- **Admin routes are prefixed with `/admin/...`** within each module instead of living in a separate admin directory. Each module exports both its public routes and its `/admin`-prefixed routes, gated by an admin auth middleware. This avoids duplicating modules for "customer" vs "admin" trees.
- Responses follow a standard shape via `response.utils.ts`; errors are normalized via `error.utils.ts`.

## Modules for this build

Only the modules below are in scope for the current gig. Anything else (reviews, payments, multi-vendor, etc.) is a future build if the client requests it.

- **auth** — admin login, JWT issuance/verification, password reset.
- **users** — admin account management (the only authenticated "users" in this app are admin/staff). No customer accounts — customers interact anonymously and leave contact details on an order/inquiry.
- **inventory** — products (name, price, stock/availability, category, description, images). Public `GET` for browsing/search/filter; `/admin` routes for create/update/delete and image upload via Cloudinary.
- **cart** — kept client-side (frontend local storage) since there's no persisted customer account; the backend only needs to accept the final order payload.
- **orders** — created from the customer's cart + contact details at checkout. Status flow (e.g. `Pending` → `Contacted` → `Completed`/`Cancelled`). Surfaced to the admin via `/admin/orders` for review — the admin calls the customer to finalize details (no payment processing in this build).
- **notifications** — email alerts (to admin on new order/inquiry, optionally a confirmation to the customer). Real-time (Socket.io) push to the admin dashboard is a possible future enhancement, not required for v1.

## Setup

Environment variables (see `.env.example`, to be filled in as configs are implemented):

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- Email provider credentials (for `email.utils.ts`)

```
npm install
npm run dev
```

## Build plan

See [plan.md](./plan.md) for the phase-by-phase build order.
