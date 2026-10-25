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
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key | Server-only privileged API access (required for `/api/checkout/*` & `/api/admin/*`); never use a `NEXT_PUBLIC_` prefix |
| `SMTP_HOST` | `smtp.gmail.com` | Email SMTP Server |
| `SMTP_PORT` | `465` | SMTP port (SSL) |
| `SMTP_USER` | `ieee.sb@bmsce.ac.in` | Official Branch Sender Email |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | 16-character App Password |
| `SMTP_FROM` | `"BMSCE IEEE" <ieee.sb@bmsce.ac.in>` | Transactional email sender display name and address |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `service-account@...` | Email of Google Service Account for Sheets integration |
| `GOOGLE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | Private key of the Google Service Account |
| `GOOGLE_SHEET_ID` | `1BxiMVs0XRYFgPN...` | ID of the Google Sheet for registration backup |

### Step 4: Deploy
Click **"Deploy"**. Within ~60 seconds, Vercel will build all 32+ pages and API routes with Next.js Turbopack and assign a live URL (e.g. `https://sb-website-theta.vercel.app` or `https://sb-website-ratik.vercel.app`).

### Database Setup, Backups & Migrations

1. **Pre-Deployment Verification & Snapshot**:
   - Run the automated test suite locally:
     ```bash
     npm test
     ```
     Verify all 49 tests pass across SAC permissions, proctors queue, teams API, and cart logic.
   - Snapshot existing database state:
     ```bash
     node scripts/backup_database.mjs
     ```
     Creates an offline JSON backup of all 17 database tables in `backups/backup_<timestamp>/`.

2. **Database Provisioning**:
   - For a **fresh database**: Execute `supabase/schema.sql`, then apply `supabase/migrations/20260927003133_security_remediation.sql`.
   - For an **existing database**: Take a backup and apply `supabase/migrations/20260927003133_security_remediation.sql`. **Do not** re-run `schema.sql` over an existing live database.
   - For **IEEEXtreme 20.0 (Hackathon Gateway)**:
     - When ready to enable hackathon registrations on the live Supabase project, execute the migration sequence in order:
       1. `supabase/migrations/20261016140000_ieeextreme_tables.sql` (base tables: `ieee_member_2026`, `xtreme_teams`, `xtreme_members`, RLS policies, registration RPC)
       2. `supabase/migrations/20261019120000_xtreme_proctors_and_ownership.sql` (managed `xtreme_proctors`, auto-claim by email, capacity enforcement RPCs)
       3. `supabase/migrations/20261019160000_harden_sac_rls.sql` (RLS policy hardening ensuring SAC role has full admin access to `xtreme_*` tables while keeping membership tables read-only)
       4. `supabase/migrations/20261019170000_xtreme_proctor_capacity_queue.sql` (per-proctor squad caps and sequential proctor fill queue)
       5. `supabase/migrations/20261024194500_import_squads_and_namratha_proctor.sql` (adds Dr. Namratha M with capacity 15 to proctors queue and imports squad rosters)
     - This creates and configures the isolated tables (`ieee_member_2026`, `xtreme_teams`, `xtreme_members`, `xtreme_proctors`), nullable team ownership with verified email auto-claim, and concurrency-safe proctor capacity enforcement procedures (`assign_proctor_to_team`, `auto_assign_proctor`). It does **not** alter or touch any existing membership or payment tables.
     - Until applied, the Xtreme module gracefully falls back to browser localStorage.
3. **Admin Provisioning**:
   - Verify that your initial executive email is present in the `admin_whitelist` table (e.g. `ratikagrawal.ec24@bmsce.ac.in` or `bms.ieeesb@gmail.com`). Admin access is provisioned strictly through this whitelist.
4. **Environment Security**:
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is saved in Vercel's Environment Variables (for Production and Preview). All server checkout APIs (`/api/checkout/*`) and admin tools (`/api/admin/*`) require this key to execute secure mutations.
5. **Post-Deployment Verification**:
   - **Student Flow**: Test account creation (`/membership/register`), profile (`/membership/profile`), chapter and T-shirt size selection (`/membership/chapters`), UPI QR generation, proof screenshot upload, and order submission (`/membership/checkout`).
   - **Member Portal**: Verify application status tracking at `/account` and test the payment resubmission modal on rejected orders.
   - **Admin Verification**: Sign into `/admin/login`, review orders on `/admin/orders`, test signed URL payment proof viewing, approve an order, and test on-demand receipt delivery (`/api/send-receipt`) with PDF attachment.
   - **Manual Receipts**: Test issuing an offline receipt via the "Issue Manual Receipt" modal and verify entry in `issued_receipts` and `admin_audit_log`.
   - **Admin Management**: Test the Announcement Bar toggle (`/admin/announcement`), Team Whitelist (`/admin/team`), and Drive Settings (`/admin/settings`).
   - **IEEEXtreme Gateway**: Verify public landing page at `/ieeextreme`, test multi-step team lead registration at `/ieeextreme/register`, team dashboard at `/ieeextreme/team`, vTools registration confirmation, and executive squad management at `/admin/xtreme` (proctor capacity tracking, squad creation, full roster editing, email copying, bulk import, and roster exports).
   - **Security Check**: Confirm direct anonymous or authenticated client writes to `orders`, `membership_config`, and `admin_whitelist` are rejected by Row-Level Security.

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
