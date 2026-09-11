# Mangan

A small, self-hostable **project-management app** (Jira / Trello / Asana, lite). Organizations
with role-based members, projects, tasks, a drag-and-drop Kanban board, a dashboard, and
in-app notifications.

**Next.js 16 (App Router) · TypeScript · Prisma 6 · PostgreSQL · Auth.js v5 · Tailwind v4 · @dnd-kit**

## Features

- **Auth** — email/password with verification and password reset, plus optional Google / GitHub
  OAuth. JWT sessions.
- **Organizations** — each user can belong to many orgs; everything is scoped under `/{orgSlug}`.
- **Members & roles** — `OWNER > ADMIN > PROJECT_MANAGER > MEMBER`. Email invites with an
  accept flow. Org role gates member management and project creation.
- **Projects** — status, priority, dates, per-project members and managers.
- **Tasks** — assignees, labels, subtasks, comments with `@mentions`, due dates, priority.
- **Kanban board** — drag and drop across columns with fractional ordering; optimistic UI.
- **Dashboard** — cross-project overview of your work.
- **Notifications** — activity fan-out to in-app notifications and email.

Deferred to later phases: subscriptions/billing, real-time WebSockets, Gantt / calendar /
time-tracking, AI features, third-party integrations, an audit-log view, and attachment uploads
(the model exists, the UI is not wired).

## Getting started

Requires Node 20+ and Docker.

```bash
cp .env.example .env          # then set AUTH_SECRET — generate one with: npx auth secret
docker compose up -d          # Postgres on :55444, Mailpit UI :8025 (SMTP :1025)
npm install
npm run db:migrate            # apply migrations
npm run db:seed               # demo org "acme" + users
npm run dev                   # http://localhost:3000
```

> **Postgres port is 55444**, not 5432 — 5432 and 5433 were taken by a native Windows Postgres
> on the original dev machine. If `localhost` still resolves to a native Postgres for you, use
> `127.0.0.1:55444` in `DATABASE_URL`. Change the port in `docker-compose.yml` and `.env` if
> you prefer.

### Seed accounts

All passwords are `password123`. They belong to the seeded org **Acme Inc** (`/acme`), which
comes with a "Website Relaunch" project and a populated board.

| Email | Org role |
| --- | --- |
| owner@mangan.local | OWNER |
| alice@mangan.local | PROJECT_MANAGER |
| bob@mangan.local | MEMBER |

Outgoing email (verification, reset, invites) is captured by **Mailpit** at
http://localhost:8025 — nothing leaves your machine.

### OAuth (optional)

Set `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` and/or `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` in
`.env`; the buttons appear on the login page automatically. Callback URL:
`http://localhost:3000/api/auth/callback/{google|github}`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests (fractional ordering) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | push schema without a migration |
| `npm run db:seed` | seed demo data |
| `npm run db:studio` | Prisma Studio |

## Architecture

```
src/
  app/
    (auth)/            register · login · verify-email · forgot-password · reset-password
    invite/accept      invitation accept flow
    (app)/
      orgs/            org list + create
      [slug]/          org-scoped area:
        dashboard
        projects/                       project list
        projects/[projectId]/           overview
        projects/[projectId]/board      Kanban
        projects/[projectId]/tasks/[taskId]
        projects/[projectId]/settings   project + members
        settings/members                org members + invites
        notifications
    api/auth/[...nextauth]
  lib/
    auth.ts / auth.config.ts   Auth.js, split so the config is edge-safe for the proxy
    authz.ts                   requireUser / requireOrg / requireOrgRole / requireProjectAccess
    roles.ts                   role hierarchy + comparisons
    ordering.ts                fractional Kanban ordering
    activity.ts                activity log + notification/email fan-out
    mail.ts · db.ts · utils.ts · constants.ts
  server/                      server actions by domain: organizations, members, projects,
                               tasks, comments, notifications, auth-actions
  components/                  UI, board, forms
  proxy.ts                     Next 16 proxy (formerly middleware) — redirects anon users to /login
```

Every mutating server action re-resolves the caller's role before acting — the proxy only
handles the coarse authenticated/anonymous redirect.

### Roles

`OWNER > ADMIN > PROJECT_MANAGER > MEMBER`. Org role gates member management and project
creation. Project membership gates task access; admins and project managers bypass it.

## Notes

- Prisma is pinned to 6.x on purpose — Prisma 7 removes `url` from the schema and requires
  driver adapters plus `prisma.config.ts`.
- Board updates are optimistic UI + `router.refresh()`; no WebSocket layer yet.
