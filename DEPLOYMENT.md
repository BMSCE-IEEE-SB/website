# BMSCE IEEE Website — Deployment Guide (Vercel & Domain Cutover)

This guide explains how to deploy the Next.js application to **Vercel** for prototype testing and how to point the production build at the branch's custom domain.

---

## 🚀 1. Deploying to Vercel

### Step 1: Connect GitHub Repository
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** &rarr; **"Project"**.
3. Import the repository: `ratik-agr/SB_Website` (or `Kiba6644/SB_Website`).
4. Select the branch (e.g. `ratik` or `main`).

### Step 2: Configure Build Settings
Vercel automatically detects Next.js:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave default)
- **Build Command**: `next build` (or `npm run build`)
- **Output Directory**: `.next`

### Step 3: Add Environment Variables
Before clicking Deploy, expand the **Environment Variables** section and add:

| Variable Name | Example / Target Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyzcompany.supabase.co` | Supabase API Endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Public Client Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key | Server-only privileged API access; never use a `NEXT_PUBLIC_` prefix |
| `SMTP_PORT` | `465` | SMTP port |
| `SMTP_HOST` | `smtp.gmail.com` | Email SMTP Server |
| `SMTP_USER` | `ieee@bmsce.ac.in` | Official Branch Sender Email |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | 16-character App Password |

### Step 4: Deploy
Click **"Deploy"**. Within ~60 seconds, Vercel will build the 14 routes with Turbopack and assign a live URL (e.g. `https://sb-website-theta.vercel.app` or `https://sb-website-ratik.vercel.app`).

### Supabase Security Migration

Before deploying this version, take a database backup and apply the SQL in `supabase/migrations/20260927003133_security_remediation.sql` to the existing project. Do not rerun `schema.sql` over an existing live database. The migration preserves historical profile/order rows, makes proof storage private, switches checkout/order/admin writes to authenticated server APIs, and backfills existing receipt numbers. Verify these workflows on a staging project first. Admin access is provisioned by the `admin_whitelist` table; do not grant roles by direct client-side writes to `admins`.

After deployment, test member checkout and resubmission, admin order review, SMTP verification, normal receipt resend, audited manual override, settings/team/content editing, and that direct anonymous/authenticated writes to orders and admin configuration are denied. Demo mode uses local storage and must not send mail.

---

## 🌐 2. Custom Domain Cutover (Production)

Once the branch is ready to switch from the temporary Vercel prototype URL to the official domain (e.g. `bmsceieee.org` or `ieee.bmsce.ac.in`):

### Step 1: Add Domain in Vercel
1. In your Vercel Project Dashboard, go to **Settings** &rarr; **Domains**.
2. Enter your custom domain (e.g., `bmsceieee.org` or `www.bmsceieee.org`).
3. Click **Add**.

### Step 2: Configure DNS Records
Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, or BMSCE College IT):

#### For Apex Domain (`bmsceieee.org`):
- **Type**: `A`
- **Name / Host**: `@`
- **Value**: `76.76.21.21`

#### For Subdomain (`www.bmsceieee.org` or `ieee.bmsce.ac.in`):
- **Type**: `CNAME`
- **Name / Host**: `www` (or `ieee`)
- **Value**: `cname.vercel-dns.com.`

### Step 3: SSL Verification
Vercel automatically provisions and renews a free Let's Encrypt SSL/TLS certificate as soon as the DNS records propagate (typically 5–30 minutes).

---

## 🔄 3. Continuous Deployment (CI/CD)
- Pushing to the production branch (`main` or `ratik`) automatically triggers a production deployment.
- Pull requests generate isolated **Preview Deployments** with unique preview URLs for the executive team to inspect before merging.
