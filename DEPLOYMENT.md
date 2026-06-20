# Deployment Guide — Railway

> **Manual setup checklist.** Follow these steps in order. Do NOT execute these steps as code — this is a manual guide for the project owner.

---

## 1. Create Railway Project

1. Go to [railway.app](https://railway.app) and log in (or sign up).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository (`faturizki1/pet-suite`).
4. Railway will auto-detect the project as a Next.js app. Let it create the initial deployment (it will fail on first run because env vars aren't set yet — that's expected).

---

## 2. Generate RAILWAY_TOKEN

1. In Railway dashboard, go to **Settings** → **Tokens**.
2. Click **Generate Token**.
3. Give it a name (e.g., `github-actions-deploy`).
4. Copy the token value immediately — it won't be shown again.
5. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**.
6. Add a new repository secret:
   - **Name:** `RAILWAY_TOKEN`
   - **Value:** (paste the token you copied)

---

## 3. Set Production Environment Variables

In Railway dashboard, go to your project → **Variables**. Add the following:

| Variable | Description | Example Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (from Neon, see step 4) | `postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/pet_suite?sslmode=require` |
| `JWT_SECRET` | **Generate a new random secret** (min 32 chars) | `openssl rand -base64 48` output |
| `MINIO_ENDPOINT` | R2 S3 API endpoint (from step 5) | `https://<accountid>.r2.cloudflarestorage.com` |
| `MINIO_ACCESS_KEY` | R2 Access Key ID | (from R2 dashboard) |
| `MINIO_SECRET_KEY` | R2 Secret Access Key | (from R2 dashboard) |
| `MINIO_PUBLIC_URL` | R2 public bucket URL (if public access enabled) or custom domain | `https://pub-<hash>.r2.dev` or `https://storage.yourdomain.com` |
| `NEXT_PUBLIC_MINIO_HOSTNAME` | Hostname for Next.js Image optimization | `storage.yourdomain.com` or `pub-<hash>.r2.dev` |
| `NODE_ENV` | Must be `production` | `production` |

### Generate JWT_SECRET

Run this locally (or any machine with `openssl`):

```bash
openssl rand -base64 48
```

Use the output as your `JWT_SECRET`. **Do not reuse the development secret.**

---

## 4. Setup PostgreSQL (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up/log in.
2. Create a new project (choose the region closest to your users).
3. Once created, copy the **connection string** from the dashboard.
   - Make sure to use the **pooled connection string** (ends with `?sslmode=require`).
4. Add this as `DATABASE_URL` in Railway variables (step 3).

---

## 5. Setup Cloudflare R2 for Storage

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2**.
2. Create a new bucket named `clinic-uploads`.
3. Go to **R2** → **Overview** → **Manage R2 API Tokens**.
4. Create a new API token with **Edit** permission.
5. Copy the **Access Key ID** and **Secret Access Key**.
6. Set these as `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in Railway variables.
7. For `MINIO_ENDPOINT`, use: `https://<accountid>.r2.cloudflarestorage.com`
   - Find your Account ID in the Cloudflare dashboard sidebar.
8. For `MINIO_PUBLIC_URL`:
   - Option A (public bucket): In R2 bucket settings, enable **Public Access** and use the provided `pub-<hash>.r2.dev` URL.
   - Option B (custom domain): Connect a custom domain to the bucket (e.g., `storage.yourdomain.com`).

---

## 6. Configure Railway Release Command (Race-Condition Safe)

Railway supports a **Release Command** that runs **once** before new replicas start. This prevents multiple replicas from running migrations simultaneously.

1. In Railway dashboard, go to your project → **Settings** → **Deploy**.
2. Find the **Release Command** field.
3. Set it to:

```
npm run db:migrate
```

4. Save. Now migrations will run automatically before each deploy, with no race condition risk.

> **Why this matters:** Without Release Command, if you have 2+ replicas, both could try to run `db:migrate` at the same time, causing conflicts. The Release Command runs exactly once before any replica starts.

---

## 7. Custom Domain (Optional)

1. In Railway dashboard, go to your project → **Settings** → **Domains**.
2. Click **Generate Domain** to get a `*.railway.app` URL (free, instant).
3. Or click **Custom Domain** and follow the DNS instructions to point your own domain.

---

## 8. Verify Deployment

1. Push to `main` branch — the GitHub Action will deploy automatically.
2. Monitor the deployment in Railway dashboard → **Deployments**.
3. Once deployed, visit your app URL and test:
   - Login page loads
   - Can register / login
   - Booking page works (public)
   - Dashboard pages load after login
   - File upload works (if R2 is configured)

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| Build fails with `DATABASE_URL` error | Missing env var | Check Railway variables are set |
| Login returns 500 | `JWT_SECRET` not set or too short | Ensure JWT_SECRET is ≥ 32 chars |
| Images not loading | `NEXT_PUBLIC_MINIO_HOSTNAME` wrong | Check the hostname matches your R2 public URL |
| Migration fails on deploy | Release Command not set | Set `npm run db:migrate` in Railway Release Command |
| 429 on login | Rate limiting (expected) | Wait 15 minutes or check IP |