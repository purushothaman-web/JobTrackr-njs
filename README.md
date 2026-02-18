# JobTrackr (Next.js)


JobTrackr is a Next.js 16 + Prisma + PostgreSQL application for tracking job applications, interviews, companies, and activity timelines.

## Features
- **Job Tracking**: Manage applications with status (Applied, Interview, Offer, Rejected).
- **Activity Heatmap**: Visualize application consistency with a GitHub-style contribution graph.
- **Weekly Reports**: Receive email summaries including recent activity and job stats.
- **Recent Activity Dashboard**: View your latest application updates directly on the profile.


## Production Readiness Verification

Verification run date: **February 11, 2026**

Checks performed:
- `npm run lint` -> passed
- `npm run build` -> passed
- API/auth flow review (JWT cookie config, sanitization, password strength checks)
- Prisma schema and migrations review
- Environment variable usage review

Current status:
- Build and lint are production-capable.
- Prisma migrations exist and can be deployed with `prisma migrate deploy`.
- Auth cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.
- Rate limiting is implemented for auth-sensitive endpoints.

Known production caveat:
- Rate limiting is in-memory (`src/lib/rateLimit.ts`), so limits are not shared across multiple instances/restarts. For horizontally scaled deployments, switch to Redis/shared storage.

## Environment Setup

Use `.env.production.example` as the production template.

```bash
cp .env.production.example .env.production
```

Set real values for all secrets:
- `DATABASE_URL`
- `JWT_SECRET`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`
- `FRONTEND_URL`

Do not commit real `.env` files.

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Production Commands

Generate Prisma client:

```bash
npm run prisma:generate
```

Deploy migrations:

```bash
npm run prisma:migrate:deploy
```

Build and run:

```bash
npm run build
npm run start
```

One-command production startup:

```bash
npm run start:prod
```

## Deployment Checklist

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Create and configure `.env.production`.
3. Run `npm ci`.
4. Run `npm run prisma:migrate:deploy`.
5. Run `npm run build`.
6. Start with `npm run start` (or process manager/container entrypoint).
7. Serve behind HTTPS and a reverse proxy.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Prisma ORM
- PostgreSQL
- JWT authentication via HTTP-only cookies
- Nodemailer for transactional emails
