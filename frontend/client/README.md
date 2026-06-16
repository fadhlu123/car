# Frontend (Client App)

React + Vite + Tailwind frontend, talking to the `backend/server` API.

> **Status:** this is currently a carry-over copy of the original prototype frontend (pages: Home, Listings, Login; `AuthContext` for JWT). It will be adapted to match the new backend's modules as they're built — in particular, customer login/auth UI will likely be removed/repurposed since customers won't have accounts (see `backend/readme.md`), and a `/checkout` flow (local cart -> order submission with contact details) and an admin dashboard (inventory + orders management, behind admin login) will be added.

## Stack

- React 19 + Vite
- Tailwind CSS
- React Router
- Axios (`src/api.js`) — base URL points at the backend API

## Setup

```
npm install
npm run dev
```

## Planned structure

- **Public site** — browse inventory, view product details, add to local cart, checkout (submit order + contact info, no payment).
- **Admin dashboard** (behind `/admin` + admin login) — manage inventory (CRUD + image upload), review incoming orders, update order status.
