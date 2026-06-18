# Build Plan

Phased build order for `backend/server`.
Each phase must be runnable and testable end-to-end before the next begins.

---

## Environment Variables

Create `backend/server/.env` with the values below. The server crashes on startup if any **Critical** variable is missing.

### Critical — app will not start without these

| Variable | How to get it | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true` |
| `JWT_SECRET` | Any 32+ char random string | `openssl rand -hex 32` |
| `JWT_ADMIN_SECRET` | Different 32+ char random string | `openssl rand -hex 32` |

### Email delivery — required for OTP, password reset, and all auth emails

Sign up at **resend.com** (free tier: 3,000 emails/month). Then:
1. Add and verify your sending domain
2. Create an API key

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxxxx` (from Resend dashboard) |
| `EMAIL_FROM` | `Auto Majid <noreply@yourdomain.com>` |

### Image upload — required for product photos

Sign up at **cloudinary.com** (free tier: 25 credits/month). Get values from Dashboard → API Keys.

| Variable | Value |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name (e.g., `djxxxxxx`) |
| `CLOUDINARY_API_KEY` | Numeric key from dashboard |
| `CLOUDINARY_API_SECRET` | Secret from dashboard |

### Admin setup

| Variable | Value |
|---|---|
| `ADMIN_EMAILS` | Comma-separated emails that become owner-role admins on first admin login. E.g. `owner@yourdomain.com` |

### Google OAuth — optional, enables "Sign in with Google"

Go to **console.cloud.google.com** → Create project → APIs & Services → Credentials → Create OAuth 2.0 Client ID. Set authorized redirect URI to `http://localhost:5000/auth/google/callback` (and your production URL).

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | `xxxxxxxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxxxxxxx` |

### Web Push / VAPID — optional, enables background push notifications (Phase 6a)

Run once in the server directory to generate your key pair:
```
npx web-push generate-vapid-keys
```

| Variable | Value |
|---|---|
| `VAPID_PUBLIC_KEY` | Public key from above command |
| `VAPID_PRIVATE_KEY` | Private key from above command |
| `VAPID_SUBJECT` | `mailto:support@yourdomain.com` |

### App config — optional (sensible defaults shown)

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Set to `production` in deployment |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin — set to your frontend URL in production |
| `SERVICE_NAME` | `ecommerce-api` | Display name used in emails |
| `LOG_LEVEL` | `debug` | Use `info` or `warn` in production |

### Full `.env` template

```env
# ── Critical ─────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=replace_with_32plus_random_chars
JWT_ADMIN_SECRET=replace_with_different_32plus_random_chars

# ── Email (Resend) ────────────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxx
EMAIL_FROM=Auto Majid <noreply@yourdomain.com>

# ── Cloudinary ────────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Admin ─────────────────────────────────────────────────────────────────────
ADMIN_EMAILS=owner@yourdomain.com

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx

# ── Web Push / VAPID ─────────────────────────────────────────────────────────
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support@yourdomain.com

# ── App config ────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVICE_NAME=Auto Majid
LOG_LEVEL=debug
```

---

## Phase 0 — Project skeleton ✅

Server starts, `GET /health` returns 200, DB connects, env errors crash on startup.

---

## Phase 1 — Auth ✅

Full authentication system: local + Google OAuth, access + refresh tokens (rotated, revocable), account lockout, audit logging, password management (forgot / reset / change), email verification, separate admin auth path signed with a different secret.

### Security design
- User access tokens: **15 min**, signed with `JWT_SECRET`, carry only `sub + email + type` — no role claim
- Admin access tokens: **15 min**, signed with `JWT_ADMIN_SECRET`, carry `sub + email + type + admin_role`
- Refresh tokens: JWT + DB record (SHA-256 hash stored, never the raw token); 30 d user / 8 h admin
- Refresh token rotation: every `/auth/refresh` revokes old session and issues new one; re-use of a revoked token triggers full session wipe
- Rate limiting: 10 req / 15 min per IP on all credential endpoints
- Account lockout: 5 consecutive failures → 15-min lock; logged in audit table
- Google OAuth: ID token verified server-side via `google-auth-library`

### Admin setup flow
1. Developer adds owner's email to `ADMIN_EMAILS` in the server `.env`
2. Owner registers via the normal `POST /auth/register` (creates a regular user account)
3. Owner calls `POST /auth/admin/login` — the server checks `ADMIN_EMAILS`, promotes the account to `role:'admin' admin_role:'owner'`, and issues an admin token
4. From this point the owner can invite staff via the team management endpoints

### Admin roles
| Role | Set by | Can do |
|---|---|---|
| `owner` | ADMIN_EMAILS env var | Everything, including invite/remove staff admins |
| `staff` | Invite from an owner | User management, inventory, orders; cannot manage team |

### Files
```
src/modules/auth/
├── types/auth.types.ts
├── routes/auth.routes.ts
├── middleware/auth.middleware.ts   (protect, adminProtect, ownerProtect, optionalProtect)
├── models/  (user, session, otp, audit)
└── services/ (token, session, otp, audit, notify-stub, password, google, user-auth, admin-auth)
```

### Endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Login |
| POST | `/auth/logout` | user | Revoke refresh token |
| POST | `/auth/refresh` | — | Issue new access token |
| POST | `/auth/google` | — | Google ID token login/register |
| POST | `/auth/verify-email` | user | Verify email with OTP |
| POST | `/auth/resend-verification` | user | Resend OTP |
| POST | `/auth/forgot-password` | — | Send password-reset OTP |
| POST | `/auth/reset-password` | — | OTP + new password |
| PATCH | `/auth/change-password` | user | Change password |
| POST | `/auth/link/google` | user | Link Google to existing account |
| GET | `/auth/me` | user | Get own profile |
| GET | `/auth/sessions` | user | List active sessions |
| DELETE | `/auth/sessions/:id` | user | Revoke a session |
| POST | `/auth/admin/login` | — | Admin login |
| POST | `/auth/admin/logout` | admin | Revoke admin refresh token |
| POST | `/auth/admin/refresh` | — | New admin access token |
| GET | `/auth/admin/me` | admin | Admin profile |
| GET | `/auth/admin/sessions` | admin | Admin active sessions |
| GET | `/auth/admin/audit-logs` | admin | Query audit log |

---

## Phase 2 — User & Team Management ✅

### User self-service
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/user/profile` | user | Get own profile |
| PATCH | `/user/profile` | user | Update name (avatar via Phase 3 Cloudinary) |

### Admin — user management (any admin)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/admin/users` | admin | List users (paginated, filterable) |
| GET | `/admin/users/:id` | admin | User detail + last 20 audit events |
| PATCH | `/admin/users/:id/unlock` | admin | Clear lockout |
| PATCH | `/admin/users/:id/deactivate` | admin | Block user (revokes all sessions) |
| PATCH | `/admin/users/:id/activate` | admin | Unblock user |

Rules: staff admin cannot modify another admin account — only owners can.

### Admin — team management (owner only)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/admin/team` | admin | List all admin accounts |
| POST | `/admin/team/invite` | owner | Send invite email to new admin |
| DELETE | `/admin/team/:id` | owner | Remove staff admin (demotes to user, revokes sessions) |
| DELETE | `/admin/team/invites/:id` | owner | Revoke a pending invite |

### Public — invite acceptance
| Method | Route | Description |
|---|---|---|
| GET | `/admin/invite/:token` | Get invite info (inviter name, email, has_account) |
| POST | `/admin/invite/accept` | Accept invite — creates account or promotes existing user |

Invite token: 32-byte cryptographically random hex, stored as SHA-256 hash in DB, expires 7 days.
`owner` accounts can only be removed by editing `ADMIN_EMAILS` and redeploying — not via the API.

### Files
```
src/modules/users/
├── models/admin.invite.model.ts
├── services/
│   ├── admin.users.service.ts
│   ├── admin.team.service.ts
│   ├── team.notify.service.ts   (invite email stub — Phase 5 wires Resend)
│   └── user.profile.service.ts
└── controllers/
    ├── admin.users.controller.ts
    ├── admin.team.controller.ts
    └── user.profile.controller.ts
users.routes.ts
```

---

## Phase 3 — Inventory / Products 🔨 NEXT

Each product lives in `auto-majid-inventory` database.

### Product model fields
`name`, `description`, `price`, `currency` (default 'GHS'), `condition` (`new` | `used`), `availability` (`available` | `sold` | `reserved`), `category`, `make`, `model`, `year`, `mileage`, `colour`, `features[]`, `images[]` (Cloudinary URLs + public_ids), `is_published`, `created_by` (admin id), `created_at`, `updated_at`

### Image upload
- Multer `memoryStorage` → Cloudinary stream upload (avoids disk writes)
- Up to 10 images per product; first image is the thumbnail
- `DELETE` on a product also deletes images from Cloudinary

### Endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/products` | — | List published products (paginated, filterable) |
| GET | `/products/:id` | — | Single product detail |
| POST | `/admin/products` | admin | Create product (multipart/form-data) |
| PATCH | `/admin/products/:id` | admin | Update fields |
| POST | `/admin/products/:id/images` | admin | Add images to existing product |
| DELETE | `/admin/products/:id/images/:imageId` | admin | Remove one image |
| DELETE | `/admin/products/:id` | admin | Delete product + Cloudinary images |
| GET | `/admin/products` | admin | List all products including unpublished |

### Files
```
src/modules/inventory/
├── inventory.types.ts
├── inventory.routes.ts
├── models/product.model.ts
├── services/
│   ├── product.service.ts        (public: list, get)
│   └── admin.product.service.ts  (CRUD + Cloudinary)
└── controllers/
    ├── product.controller.ts
    └── admin.product.controller.ts
src/configs/cloudinary.config.ts
src/utils/upload.utils.ts          (multer + Cloudinary stream helper)
```

**Done when:** admin uploads a product with images via Cloudinary; public API lists it with filters.

---

## Phase 4 — Orders ✅

Cart is client-side (localStorage). Orders live in `auto-majid-orders` database.

### Order model
`items[]` (productId, name snapshot, price snapshot, qty), `customer` (name, phone, email, notes), `status` (`pending` | `contacted` | `completed` | `cancelled`), `created_at`

### Endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/orders` | optionalUser | Submit cart + contact info |
| GET | `/admin/orders` | admin | List orders (filtered by status) |
| GET | `/admin/orders/:id` | admin | Order detail |
| PATCH | `/admin/orders/:id/status` | admin | Update status |

**Done when:** customer submits order; admin views and updates status.

---

## Phase 5 — Notifications ✅

### Email engine (HBS templates)
Emails are rendered via a Handlebars template engine — **not** inline strings.
- `src/utils/email.engine.ts` — `renderTemplate(name, context)` → compiled HTML string
- `src/templates/email/` — one `.hbs` file per email type:
  - `verify-email.hbs`, `password-reset.hbs`, `welcome.hbs`
  - `admin-invite.hbs`
  - `order-confirmation.hbs`, `new-order-admin.hbs`
- All `// TODO Phase 5` stubs in `auth.notify.service.ts`, `team.notify.service.ts`, `order.notify.service.ts` call `renderTemplate(type, ctx)` then pass HTML to Resend

### Email delivery
- Install `handlebars` + `@types/handlebars`
- Wire `RESEND_API_KEY` in `utils/email.utils.ts` (replace console stub)
- Auth emails: verify-email OTP, password-reset OTP, login-from-new-device alert
- Team email: admin invite with accept link
- Order emails: admin notification on new order, customer order confirmation

### In-app notifications
- Notification model: `{ recipient_id, recipient_type ('user'|'admin'), type, title, body, read, metadata, created_at }` in `auto-majid-orders` DB
- Admin dashboard queries `recipient_type: 'admin'`; user app queries `recipient_type: 'user'`
- Roles are fully separated — same model, different data partitions

**Done when:** all emails deliver via Resend with rendered HBS templates; in-app notifications are queryable.

---

## Phase 6a — Push Notifications (backend — build before frontend)

Push can be backend-built now; testing requires the frontend service worker.

### How it works
1. Frontend registers a service worker → calls `navigator.serviceWorker.registration.pushManager.subscribe()` with the server's VAPID public key
2. Browser returns a `PushSubscription` object (endpoint URL + encryption keys)
3. Frontend POSTs it to `POST /notifications/push/subscribe`
4. Server stores the subscription; whenever a relevant event fires, `web-push.sendNotification(subscription, payload)` delivers it — even when the user is not in the app

### New environment variables
```
VAPID_PUBLIC_KEY=          # from: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support@yourdomain.com
```

### New model — `PushSubscription` (`auto-majid-notifications` DB)
| Field | Type | Notes |
|---|---|---|
| `user_id` | ObjectId | optional — guests cannot use push |
| `endpoint` | String | unique per browser instance |
| `keys.p256dh` | String | browser encryption key |
| `keys.auth` | String | browser auth secret |
| `user_agent` | String | for display/management |
| `created_at` | Date | |

### Endpoints
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/notifications/push/vapid-key` | — | Return VAPID public key to frontend |
| POST | `/notifications/push/subscribe` | user | Save / upsert push subscription |
| DELETE | `/notifications/push/unsubscribe` | user | Remove subscription (logout / opt-out) |

### Dispatcher integration — events that trigger push
| Event | Push title | Body |
|---|---|---|
| `order_status_update` | "Order update" | "Your order is now {status}" |
| `welcome` | "Welcome!" | "Your account is ready" |
| `new_order_admin` | "New order" | "#{shortId} — {customer name}" |

Broadcast (admin → all users via SSE) does **not** use push — SSE is sufficient while the app is open; push is for background delivery only.

### Files
```
src/modules/notifications/
├── models/push-subscription.model.ts
├── services/push.service.ts          (save, remove, sendToUser, sendToAllAdmins)
└── routes/notifications.routes.ts    (add 3 push endpoints)
```

---

## Phase 6b — Frontend (React + Vite)

Already bootstrapped at `frontend/client/`.

### Public pages
- Product listing — filters: condition, category, price range, make, text search
- Product detail — image gallery, specs table
- Cart (localStorage) → checkout form → `POST /orders` → confirmation page

### User auth pages
- Register / Login / Forgot password / Reset password (OTP)
- Email verification (enter OTP after register)
- Profile page + active sessions list + revoke

### Admin dashboard
- Login (separate admin JWT)
- Inventory: product list, add/edit/delete with multi-image upload
- Orders: list + detail + status transitions
- Users: list + unlock / activate / deactivate
- Team: list admins, invite, revoke pending invite
- Notifications: feed, mark read, broadcast publisher

### Real-time integration
- On login: open `EventSource` to `/notifications/sse` → badge updates in real time
- On first load: register service worker, subscribe to push, POST to `/notifications/push/subscribe`
- Service worker (`public/sw.js`): handles `push` event → `self.registration.showNotification(title, opts)`

### PWA essentials
- `manifest.json` with app name, icons, `start_url`
- `theme-color`, offline fallback page
- Service worker pre-caches shell (public assets only — no API data)

---

## Future / out of scope for this gig
- Gateway middlewares (Security, cors, infact all the middleware, rateliiting a public one before the authrate limiter, it covers the other sub modules without a middleware..apparently the auth only middlewrae is role checking)
- Payment integration
- Customer order history per login
- Reviews, wishlists, multi-vendor
- Redis caching
- 2FA / TOTP (`auth.2fa.service.ts` stub already exists)
