# Mangan — Project Management SaaS (MVP)

A small, self-hostable project-management app: organizations/workspaces, team members with
roles, projects, tasks, a drag-and-drop Kanban board, a dashboard, and notifications.

Built with **Next.js 16 (App Router) · TypeScript · Prisma · PostgreSQL · Auth.js v5 · Tailwind · @dnd-kit**.

## MVP flow

Login → Organization → Team (invite / roles) → Project → Tasks → Kanban board → Dashboard → Notifications

Deferred to later phases: subscriptions/payments, real-time WebSockets, Gantt/calendar/time-tracking,
AI features, third-party integrations, audit logs.

## Getting started

```bash
cp .env.example .env          # then set AUTH_SECRET (npx auth secret) for real use
docker compose up -d          # Postgres on :55444, Mailpit on :8025 (SMTP :1025)
npm install
npm run db:migrate            # apply migrations
npm run db:seed               # demo org "acme" + users (password: password123)
npm run dev                   # http://localhost:3000
```

> The Postgres host port is **55444** (5432/5433 were already taken on this machine).
> Change it in `docker-compose.yml` and `DATABASE_URL` if you prefer.

### Seed accounts

| Email | Role | Password |
| --- | --- | --- |
| owner@mangan.local | OWNER | password123 |
| alice@mangan.local | PROJECT_MANAGER | password123 |
| bob@mangan.local | MEMBER | password123 |

Emails (verification, password reset, invites) are caught by **Mailpit** at http://localhost:8025.

### OAuth (optional)

Set `AUTH_GOOGLE_ID/SECRET` and/or `AUTH_GITHUB_ID/SECRET` in `.env`; the buttons appear on the
login page automatically. Callback URL: `http://localhost:3000/api/auth/callback/{google|github}`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests (ordering, role checks) |
| `npm run db:migrate` / `db:push` / `db:seed` / `db:studio` | Prisma |

## Architecture

- **`src/app/(auth)/`** — register, login, verify-email, forgot/reset-password
- **`src/app/(app)/[slug]/`** — org-scoped area: `dashboard`, `projects`, `projects/[id]/board`,
  `projects/[id]/tasks/[taskId]`, `projects/[id]/settings`, `settings/members`, `notifications`
- **`src/lib/`** — `auth.ts` / `auth.config.ts` (Auth.js, split for edge proxy), `authz.ts`
  (`requireUser` / `requireOrg` / `requireOrgRole` / `requireProjectAccess`), `roles.ts`,
  `ordering.ts` (fractional Kanban ordering), `activity.ts` (activity + notification fan-out),
  `mail.ts`, `db.ts`
- **`src/server/`** — server actions grouped by domain (organizations, members, projects, tasks,
  comments, notifications, auth-actions). Every mutating action re-resolves the caller's role first.
- **`src/proxy.ts`** — Next 16 proxy (formerly middleware); redirects unauthenticated users to `/login`.

### Roles

`OWNER > ADMIN > PROJECT_MANAGER > MEMBER`. Org role gates member management and project creation;
project membership gates task access (managers/admins bypass).

## Notes / next steps

- Real-time board updates (Socket.IO) — currently optimistic UI + `router.refresh()`.
- Attachments model exists but upload UI is not wired (local disk → S3 later).
- Rate limiting on auth routes, audit log view, subscription/billing module.
