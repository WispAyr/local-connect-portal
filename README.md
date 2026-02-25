# Local Connect Client Portal

Multi-tenant client portal for Local Connect — digital services, project management, asset delivery, and payments.

## Stack
- **Backend:** Node.js + Express + better-sqlite3
- **Frontend:** React + Vite + Tailwind CSS + Lucide icons
- **Auth:** JWT + bcrypt
- **Payments:** Stripe (stubbed)

## Quick Start
```bash
npm install
cd client && npm install && cd ..
npm run dev
```
- Server: http://localhost:3900
- Client: http://localhost:5900

## Default Login
- Email: `ewan@parkwise.tech`
- Password: `admin2026`

## Module System
Add modules in `server/modules/` — see `server/modules/README.md` for the interface spec.

## Architecture
See project task spec for full details. Key patterns:
- Multi-tenant with role-based access (admin/staff/client)
- Module loader discovers plugins at startup
- Client branding via CSS variables (digital=blue, events=purple)
- Stripe payment flow with asset locking
