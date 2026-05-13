# Vercel Deployment Guide

## 1. Get a Neon database (replaces Docker)

1. Go to neon.tech → create free account → create project "portfolio"
2. Copy **two** connection strings from the Neon dashboard:
   - **Pooled URL** (for runtime): `postgresql://...@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
   - **Direct URL** (for migrations): `postgresql://...@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

## 2. Run migrations on Neon

```bash
# Set DATABASE_URL to the DIRECT URL temporarily
DATABASE_URL="postgresql://...direct..." npx prisma migrate deploy
DATABASE_URL="postgresql://...direct..." npx prisma db seed
```

## 3. Push to GitHub

```bash
git remote add origin https://github.com/yourusername/portfolio.git
git push -u origin main
```

## 4. Connect to Vercel

1. vercel.com → New Project → Import from GitHub → select repo
2. Framework: Next.js (auto-detected)
3. Build command: `prisma generate && next build` ← already set in package.json
4. Root directory: `/` (default)

## 5. Set Environment Variables in Vercel Dashboard

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** URL (with `?sslmode=require`) |
| `AUTH_SECRET` | Run `openssl rand -base64 32` for a fresh secret |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `ADMIN_EMAIL` | `aleksanderiljas@gmail.com` |
| `ADMIN_PASSWORD` | A strong password (for seeding — run seed manually after deploy) |

## 6. Deploy

Click Deploy. Build runs:
1. `npm install` → triggers `postinstall` → `prisma generate` ✓
2. `next build` ✓

## Notes

- **Docker**: not needed on Vercel. Local dev still uses docker-compose.
- **Pooled vs Direct URL**: use Pooled for `DATABASE_URL` (prevents connection exhaustion on serverless). If Prisma migrations fail with the pooled URL, run them locally against the direct URL.
- **`AUTH_SECRET`**: next-auth v5 reads `AUTH_SECRET`. The fallback `NEXTAUTH_SECRET` is kept for local dev compatibility.
- **Admin password**: after first deploy, run `npm run db:seed` locally pointing at the Neon direct URL to create the admin account.
