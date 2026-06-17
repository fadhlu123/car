# Frontend Plan

Two separate Vite + React + TypeScript apps deployed to different URLs:

| App | Directory | Audience | URL (example) |
|---|---|---|---|
| Customer site | `frontend/client/` | Public + logged-in users | `automajid.com` |
| Admin dashboard | `frontend/admin/` | Admin team only | `admin.automajid.com` |

Both apps share the same backend API (`backend/server`). No code is shared between them — each is self-contained.

---

## Current state of `frontend/client/`

Issues to fix before building further:

- All files are `.jsx` / `.js` — needs conversion to TypeScript
- Only 3 pages: Home, Listings, Login — all other routes are missing
- No register, verify-email, forgot-password, reset-password pages
- No product detail page
- No cart or checkout page
- No user profile or order history pages
- Auth context stores tokens in `localStorage` but has no token refresh logic
- `apiClient.js` has no 401 → refresh → retry flow
- Currency is hardcoded as USD — should be GHS (Ghana Cedis)
- No SSE connection for real-time notification updates
- No push notification subscription registration
- No notification bell or feed component
- `format.utils.js` formats as USD — needs to be locale-aware with GHS default
- Missing TypeScript types for all API responses
- `tailwind.config.js` needs to align with Tailwind v4 CSS-first approach

---

## `frontend/client/` — Target structure

```
frontend/client/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.ts
├── .env                  (VITE_API_URL=http://localhost:5000/api)
├── .env.production       (VITE_API_URL=https://api.yourdomain.com/api)
├── public/
│   ├── favicon.svg
│   ├── logo.jpg
│   └── sw.js             (service worker — handles push events)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css           (Tailwind base + custom components)
    │
    ├── configs/
    │   └── env.ts          (typed: VITE_API_URL, VITE_VAPID_PUBLIC_KEY)
    │
    ├── types/              (mirrors backend response shapes)
    │   ├── auth.types.ts
    │   ├── inventory.types.ts
    │   ├── orders.types.ts
    │   └── notification.types.ts
    │
    ├── services/           (one file per backend module — all API calls live here)
    │   ├── api.client.ts   (axios instance + auth interceptor + 401-refresh-retry)
    │   ├── auth.service.ts
    │   ├── inventory.service.ts
    │   ├── orders.service.ts
    │   └── notifications.service.ts
    │
    ├── store/              (React context or Zustand — global state)
    │   ├── auth.store.tsx  (user, accessToken, isLoading, login, logout, refresh)
    │   └── cart.store.tsx  (items, addToCart, removeFromCart, clearCart, total)
    │
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useCart.ts
    │   ├── useSSE.ts       (opens EventSource on login, closes on logout)
    │   └── usePush.ts      (registers service worker + subscribes to push)
    │
    ├── utils/
    │   ├── format.utils.ts (formatCurrency → GHS, formatDate → locale)
    │   ├── storage.utils.ts (typed localStorage helpers)
    │   └── error.utils.ts  (extract message from axios error)
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.tsx       (Navbar + <Outlet /> + Footer)
    │   │   ├── Navbar.tsx       (logo, nav links, cart icon, auth button)
    │   │   └── Footer.tsx
    │   ├── ui/                  (reusable primitives — no business logic)
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx        (condition, availability, status labels)
    │   │   ├── Spinner.tsx
    │   │   ├── Modal.tsx
    │   │   └── ErrorMessage.tsx
    │   ├── product/
    │   │   ├── ProductCard.tsx
    │   │   ├── ProductGrid.tsx
    │   │   └── ProductFilters.tsx (condition, category, price, make)
    │   ├── cart/
    │   │   ├── CartDrawer.tsx   (slide-out panel)
    │   │   └── CartItem.tsx
    │   └── notifications/
    │       ├── NotificationBell.tsx (badge + dropdown)
    │       └── NotificationItem.tsx
    │
    ├── pages/
    │   ├── public/              (no auth required)
    │   │   ├── Home.tsx
    │   │   ├── Listings.tsx
    │   │   ├── ProductDetail.tsx
    │   │   └── NotFound.tsx
    │   ├── auth/                (guest only — redirect to home if logged in)
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── VerifyEmail.tsx      (enter OTP sent to email)
    │   │   ├── ForgotPassword.tsx   (enter email → receive OTP)
    │   │   └── ResetPassword.tsx    (enter OTP + new password)
    │   ├── cart/
    │   │   └── Checkout.tsx     (cart review + contact form → POST /orders)
    │   └── user/                (auth required)
    │       ├── Profile.tsx      (view/edit name, avatar)
    │       └── OrderHistory.tsx (list of own orders + status)
    │
    └── router/
        ├── index.tsx            (all route definitions in one place)
        └── guards/
            ├── PrivateRoute.tsx (redirects to /auth/login if not authenticated)
            └── GuestRoute.tsx   (redirects to / if already authenticated)
```

---

## `frontend/client/` — Key implementation notes

### `configs/env.ts`
```typescript
export const ENV = {
  API_URL:          import.meta.env.VITE_API_URL  ?? 'http://localhost:5000/api',
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '',
};
```

### `services/api.client.ts`
- Axios instance with `baseURL = ENV.API_URL`
- Request interceptor: reads `accessToken` from auth store, injects `Authorization: Bearer <token>`
- Response interceptor: on 401 → call `POST /auth/refresh` with stored refresh token → retry original request → if refresh fails, call `logout()` and redirect to `/auth/login`

### `services/auth.service.ts`
```typescript
login(email, password)                      // POST /auth/login
register(email, password, first_name, last_name) // POST /auth/register
logout(sessionId)                           // POST /auth/logout
refreshToken(refreshToken)                  // POST /auth/refresh
verifyEmail(userId, otp)                    // POST /auth/verify-email
resendVerification()                        // POST /auth/resend-verification
forgotPassword(email)                       // POST /auth/forgot-password
resetPassword(email, otp, newPassword)      // POST /auth/reset-password
changePassword(oldPassword, newPassword)    // PATCH /auth/change-password
getProfile()                                // GET /auth/me
getSessions()                               // GET /auth/sessions
revokeSession(sessionId)                    // DELETE /auth/sessions/:id
googleAuth(idToken)                         // POST /auth/google
```

### `services/notifications.service.ts`
```typescript
getNotifications(page, limit)              // GET /notifications
getUnreadCount()                           // GET /notifications/unread-count
getBroadcasts()                            // GET /notifications/broadcasts
markRead(id)                               // PATCH /notifications/:id/read
markAllRead()                              // PATCH /notifications/read-all
getVapidKey()                              // GET /notifications/push/vapid-key
subscribePush(subscription)               // POST /notifications/push/subscribe
unsubscribePush(endpoint)                 // DELETE /notifications/push/unsubscribe
```

### `hooks/useSSE.ts`
- Opens `EventSource` to `GET /notifications/stream` when user logs in (sends token as query param since EventSource doesn't support custom headers)
- Listens for `notification` events → updates unread count in store
- Listens for `broadcast` events → shows toast
- Closes stream on logout or component unmount
- Auto-reconnects with exponential backoff on disconnect

### `hooks/usePush.ts`
- Calls `navigator.serviceWorker.register('/sw.js')` on mount
- After registration, calls `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: ENV.VAPID_PUBLIC_KEY })`
- POSTs the resulting `PushSubscription` to `POST /notifications/push/subscribe`
- Only runs if user is logged in and VAPID key is configured

### `public/sw.js` — Service worker
```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  '/logo.jpg',
      badge: '/favicon.svg',
      data:  { url: data.url },
      tag:   data.tag,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'));
});
```

### Cart → Checkout flow
1. User browses Listings → clicks "Add to cart" → product added to `CartStore` (localStorage)
2. Cart drawer shows items with quantities
3. User clicks Checkout → `/cart/checkout`
4. Checkout page: review cart + fill name/phone/email/notes
5. Submit → `POST /orders` with cart items + customer info
6. Success → show order confirmation with order ID

### Currency
All prices are in **GHS (₵)**. Update `formatCurrency`:
```typescript
export const formatCurrency = (amount: number, currency = 'GHS') =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(amount);
```

### Auth token storage
- `accessToken` — memory only (in auth store / React state). Never written to localStorage.
- `refreshToken` — localStorage only. This is the standard SPA approach.
- On page reload: auth store initialises empty → immediately calls `POST /auth/refresh` using stored refresh token → if ok, sets new access token in memory → user appears logged in

---

## `frontend/admin/` — New app

Scaffold with: `npm create vite@latest admin -- --template react-ts`

```
frontend/admin/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── .env                  (VITE_API_URL=http://localhost:5000/api)
├── public/
│   └── sw.js             (same push handler as client)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    │
    ├── configs/
    │   └── env.ts
    │
    ├── types/
    │   ├── auth.types.ts
    │   ├── inventory.types.ts
    │   ├── orders.types.ts
    │   ├── users.types.ts
    │   └── notification.types.ts
    │
    ├── services/
    │   ├── api.client.ts           (uses admin access token; refresh via /auth/admin/refresh)
    │   ├── admin.auth.service.ts
    │   ├── admin.inventory.service.ts
    │   ├── admin.orders.service.ts
    │   ├── admin.users.service.ts
    │   ├── admin.team.service.ts
    │   └── admin.notifications.service.ts
    │
    ├── store/
    │   └── admin.store.tsx          (adminUser, isLoading, login, logout)
    │
    ├── hooks/
    │   ├── useAdminAuth.ts
    │   ├── useAdminSSE.ts           (connects to /admin/notifications/stream)
    │   └── useAdminPush.ts
    │
    ├── utils/
    │   ├── format.utils.ts
    │   └── error.utils.ts
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AdminLayout.tsx      (wraps all admin pages: sidebar + topbar)
    │   │   ├── Sidebar.tsx          (nav: Dashboard, Inventory, Orders, Users, Team, Notifications)
    │   │   └── TopBar.tsx           (admin name, notification bell, logout)
    │   └── ui/
    │       ├── Button.tsx
    │       ├── DataTable.tsx        (sortable, paginated table)
    │       ├── Modal.tsx
    │       ├── Badge.tsx
    │       ├── Spinner.tsx
    │       ├── ImageUpload.tsx      (multi-image drag-and-drop → POST /admin/products/:id/images)
    │       ├── StatusSelect.tsx     (order status dropdown with transition validation)
    │       └── ConfirmDialog.tsx
    │
    ├── pages/
    │   ├── auth/
    │   │   └── Login.tsx            (POST /auth/admin/login)
    │   ├── dashboard/
    │   │   └── Overview.tsx         (stats cards: orders today, revenue, inventory count, users)
    │   ├── inventory/
    │   │   ├── ProductList.tsx      (table + search + publish toggle)
    │   │   ├── ProductForm.tsx      (create + edit: all fields + image upload)
    │   │   └── ProductImages.tsx    (add / remove images for existing product)
    │   ├── orders/
    │   │   ├── OrderList.tsx        (table + status filter + date filter)
    │   │   └── OrderDetail.tsx      (items table, customer info, status history, update status)
    │   ├── users/
    │   │   ├── UserList.tsx         (table + search + role filter)
    │   │   └── UserDetail.tsx       (audit log, unlock/deactivate/activate actions)
    │   ├── team/
    │   │   ├── Team.tsx             (list admins + pending invites)
    │   │   └── InviteModal.tsx      (send invite email by entering email address)
    │   └── notifications/
    │       ├── AdminNotificationFeed.tsx  (inbox: personal + shared notifications)
    │       └── BroadcastManager.tsx       (create/edit/deactivate broadcasts to all users)
    │
    └── router/
        ├── index.tsx
        └── guards/
            └── AdminRoute.tsx       (redirect to /login if no admin session)
```

---

## `frontend/admin/` — Key implementation notes

### `services/api.client.ts`
- Separate axios instance from the client site
- Refresh endpoint: `POST /auth/admin/refresh`
- Admin tokens expire in 8 hours (vs 30 days for users)
- On 401 during refresh: clear admin store, redirect to `/login`

### `services/admin.auth.service.ts`
```typescript
login(email, password)            // POST /auth/admin/login
logout()                          // POST /auth/admin/logout
refresh(refreshToken)             // POST /auth/admin/refresh
getProfile()                      // GET /auth/admin/me
getSessions()                     // GET /auth/admin/sessions
revokeSession(sessionId)          // DELETE /auth/admin/sessions/:id
getAuditLogs(query)               // GET /auth/admin/audit-logs
```

### `services/admin.inventory.service.ts`
```typescript
listProducts(query)               // GET /admin/products
createProduct(data, files)        // POST /admin/products (multipart/form-data)
updateProduct(id, data)           // PATCH /admin/products/:id
addImages(id, files)              // POST /admin/products/:id/images
removeImage(id, imageId)          // DELETE /admin/products/:id/images/:imageId
deleteProduct(id)                 // DELETE /admin/products/:id
```

### Image upload
Use `FormData` for multipart requests. `ImageUpload` component accepts multiple files, previews them, then calls `addImages` or includes them in `createProduct`. Show upload progress per file.

### `services/admin.notifications.service.ts`
```typescript
getNotifications(query)                    // GET /admin/notifications
markRead(id)                               // PATCH /admin/notifications/:id/read
markAllRead()                              // PATCH /admin/notifications/read-all
getBroadcasts(query)                       // GET /admin/notifications/broadcasts
createBroadcast(data)                      // POST /admin/notifications/broadcasts
updateBroadcast(id, data)                  // PATCH /admin/notifications/broadcasts/:id
deleteBroadcast(id)                        // DELETE /admin/notifications/broadcasts/:id
subscribePush(subscription)               // POST /admin/notifications/push/subscribe
unsubscribePush(endpoint)                 // DELETE /admin/notifications/push/unsubscribe
```

### Real-time (SSE)
The admin SSE stream (`GET /admin/notifications/stream`) pushes:
- `new_order` — new order badge on sidebar, toast, push (if subscribed)
- `notification` — personal notification, bell badge increments
- `broadcast_removed` — remove broadcast from active list

### `components/ui/DataTable.tsx`
Reusable table for all list pages. Props:
- `columns: { key, label, render? }[]`
- `data: T[]`
- `loading: boolean`
- `pagination: { page, limit, total_pages, onChange }`
- `onRowClick?: (row: T) => void`

---

## Environment variables

### `frontend/client/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_VAPID_PUBLIC_KEY=      # copy from backend VAPID_PUBLIC_KEY (GET /notifications/push/vapid-key)
```

### `frontend/admin/.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_VAPID_PUBLIC_KEY=      # same key — both apps can receive push
```

Production values:
```env
# client
VITE_API_URL=https://api.yourdomain.com/api
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

# admin
VITE_API_URL=https://api.yourdomain.com/api
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

---

## Build order

### Phase 1 — Restructure `frontend/client/`
1. Convert all `.jsx`/`.js` to `.tsx`/`.ts`
2. Add `tsconfig.json`, convert `vite.config.js` to `.ts`
3. Create `configs/env.ts`, `types/`, `utils/` (with GHS currency formatter)
4. Rebuild `services/api.client.ts` with proper refresh logic
5. Rebuild `store/auth.store.tsx` (memory accessToken + localStorage refreshToken)
6. Rebuild `store/cart.store.tsx` (typed)
7. Add `router/index.tsx` with all routes + guards
8. Build auth pages: Login, Register, VerifyEmail, ForgotPassword, ResetPassword
9. Build public pages: Home (existing, typed), Listings (existing, typed), ProductDetail (new)
10. Build cart + checkout flow
11. Build user pages: Profile, OrderHistory
12. Add `hooks/useSSE.ts` + `NotificationBell` component
13. Add `hooks/usePush.ts` + `public/sw.js`

### Phase 2 — Build `frontend/admin/`
1. Scaffold new Vite React TS app: `npm create vite@latest admin -- --template react-ts`
2. Install: `axios`, `react-router-dom`, `tailwindcss`, `lucide-react`
3. Create all service files, store, hooks, utils
4. Build layout: Sidebar + TopBar + AdminLayout
5. Build auth: Login page + AdminRoute guard
6. Build Dashboard: Overview stats
7. Build Inventory: ProductList + ProductForm with image upload
8. Build Orders: OrderList + OrderDetail with status management
9. Build Users: UserList + actions (unlock, activate, deactivate)
10. Build Team: list admins + invite flow
11. Build Notifications: feed + BroadcastManager
12. Wire SSE + push
