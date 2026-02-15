# JobTrackr Deployment Guide (Vercel)

This guide outlines the steps to deploy the **JobTrackr** application to Vercel.

## 1. Prerequisites

- A [Vercel Account](https://vercel.com).
- The project pushed to a Git repository (GitHub, GitLab, or Bitbucket).
- A hosted PostgreSQL database (e.g., Supabase, Neon, or Vercel Postgres).

## 2. Environment Variables

You must configure the following environment variables in your Vercel project settings. Use the values from your `.env.production` (or `.env` for local).

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for your PostgreSQL database (Transaction Mode). | `postgres://user:pass@host:6543/db?pgbouncer=true` |
| `DIRECT_URL` | Direct connection string for migrations (Session Mode). | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for signing JWT tokens. | `your-secure-random-string` |
| `FRONTEND_URL` | The URL of your deployed frontend (Vercel URL). **Crucial for CORS.** | `https://your-project.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Public URL used in the app (same as FRONTEND_URL). | `https://your-project.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Base path for API calls. | `/api` |
| `MAIL_HOST` | SMTP server host for emails. | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port (usually 465 or 587). | `465` |
| `MAIL_USER` | SMTP username (email address). | `user@example.com` |
| `MAIL_PASS` | SMTP password (or app password). | `your-app-password` |
| `MAIL_FROM` | Email address to send from. | `noreply@example.com` |

> **Note:** For `DATABASE_URL` and `DIRECT_URL`, if using Supabase, ensure you use the correct pooling vs direct connection strings.

## 3. Database Migration

Can be handled in two ways:

### Option A: Run manually before deployment (Recommended for first deploy)
Run this command locally to apply migrations to your production database:
```bash
npx prisma migrate deploy
```
*Make sure your local `.env` points to the production DB temporarily, or use the `--url` flag.*

### Option B: Automate in Vercel Build
1. Go to your Vercel Project Settings > **General** > **Build & Development Settings**.
2. Override the **Build Command** to:
   ```bash
   npx prisma migrate deploy && next build
   ```
   *Note: This will run migrations on every deployment.*

## 4. Deployment Steps

1.  **Import Project**: Log in to Vercel and click **"Add New..."** -> **"Project"**. Import your Git repository.
2.  **Configure Project**:
    - **Framework Preset**: Next.js (should be auto-detected).
    - **Root Directory**: `.` (default).
    - **Environment Variables**: Copy-paste your variables here. You can copy the contents of your `.env` file and paste them into the first field; Vercel will parse them.
3.  **Deploy**: Click **"Deploy"**. Vercel will build your app.
4.  **Verify**: Once deployed, visit the URL.
    - Check the **CORS** configuration by making a request or logging in.
    - If you see CORS errors, ensure `FRONTEND_URL` matches your Vercel domain exactly (no trailing slash).

## 5. Post-Deployment Checks

- **CORS**: Verify that requests from your frontend to `/api/*` are successful.
- **Database**: Ensure data is loading correctly.
- **Emails**: Test an action that sends an email (e.g., Forgot Password) to verify SMTP settings.

## Troubleshooting

- **500 Internal Server Error**: Check Vercel **Logs** tab. Often due to missing env vars or DB connection issues.
- **CORS Error**: Check `middleware.ts` logic and ensure `FRONTEND_URL` is correct.
