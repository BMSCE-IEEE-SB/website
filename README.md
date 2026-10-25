# BMSCE IEEE Student Branch Website

Official website for the **IEEE Student Branch at B.M.S. College of Engineering (Region 10)**. Built with Next.js 16 (App Router), Tailwind CSS v4, and Supabase for the 2026 Annual Membership Drive.

The public landing page (chapters, team, partnerships) and the membership registration flow live in one site. Every "Become a member" button leads to `/membership/register`.

### Demo mode vs live mode
- **Demo mode** runs when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set. Everything is stored in the browser's localStorage with sample admin data, any login works, and a blue "Demo mode" note appears on the forms.
- **Live mode** runs as soon as both variables are set. Demo shortcuts disappear, real Supabase Auth is required, and admin rights come only from the `admins` table.

### Main pages
| Page | What it is |
|---|---|
| `/` | Landing page (Hero, About, Chapters, ExeCom, Partners) |
| `/chapters/[slug]` | Chapter detail pages (`cs`, `pes`, `pels-ies`, `wie`, `ssit`) |
| `/membership` | "Become a member": benefits, fee slip calculator, FAQ |
| `/membership/register` → `/profile` → `/chapters` → `/checkout` | The four-step registration flow (includes T-shirt size selection) |
| `/login` | Member portal sign in |
| `/login/reset` | Password reset request for member accounts |
| `/account` | Member portal: digital card, status tracker, payment resubmission |
| `/admin/login` | Executive administrator sign in |
| `/admin/orders` | Orders ledger, payment proof verification, and receipt dispatch |
| `/admin/announcement` | Sitewide announcement banner editor |
| `/admin/team` | Executive team access & whitelist manager |
| `/admin/settings` | Membership drive status, base fee, UPI VPA & treasurer settings |
| `/privacy`, `/terms`, `/refund` | Official student branch legal & policy pages |
| `/ieeextreme` | IEEEXtreme 20.0 public landing page (rules, countdown, FAQ) |
| `/ieeextreme/register` | Multi-step lead-delegated team registration flow (1–3 members) |
| `/ieeextreme/success` | Post-registration gateway & official IEEE vTools confirmation |
| `/ieeextreme/team` | Team Lead dashboard for roster, assigned proctor & lock status |
| `/admin/xtreme` | IEEEXtreme teams management, proctor assignment, and CSV export |

### Where to edit site content
All landing-page text, chapters, testimonials, FAQs and ExeCom members are in `src/data/site.ts`. The testimonials there are **placeholders**. Chapter prices for payment come from the `chapters` table in live mode.

---

## 🌟 Key Features

### 🎓 1. Multi-Step Student Membership Flow
- **Minimal Initial Sign-Up** (`/membership/register`): Email, password, and confirm password with an email verification gate.
- **Academic & Personal Profile** (`/membership/profile`): Full Name, USN, Department (19 standardized engineering branches), Year of Study, Contact Info, and optional IEEE Member ID with auto-fill sample testing helper.
- **Dynamic Chapters Shopping Cart** (`/membership/chapters`):
  - Fixed Base Branch Membership fee (₹1,810).
  - Visual branding tiles embedding each chapter's official logo directly in the card background.
  - Interactive add/remove for all 5 technical chapters and affinity groups (Computer Society, PES, PELS/IES, WIE, SSIT; WIE included with base membership at ₹0).
  - **T-Shirt Size Selector**: Members select their merchandise size ('XS', 'S', 'M', 'L', 'XL', '2XL', '3XL') directly in the cart.
- **Dynamic UPI QR Checkout** (`/membership/checkout`):
  - Server-verified checkout intent (`/api/checkout/intent`) enforcing server-side price validation and expiration.
  - Client-side generated UPI payment QR code (`qrcode.react`) encoding the exact total and a unique order reference (`BMSCE-XXXXXX`).
  - **Copy UPI ID** & **Copy Amount** buttons for mobile users paying on the same device.
  - **Download QR Code** image button.
  - Payment proof screenshot upload with server-validated MIME and size limits (`/api/checkout/proof`), stored securely in a private Supabase Storage bucket.
  - Final checkout submission via `/api/checkout/submit` storing UTR and order metadata.
- **Member Dashboard** (`/account`):
  - Real-time status tracking (`Pending Verification`, `Verified`, or `Rejected`).
  - **Interactive Resubmission** (`/api/checkout/resubmit`): If an application is rejected with admin feedback, students can resubmit a clear screenshot and correct their UTR directly without re-ordering.
- **Dynamic Drive Gating & Route Protection**:
  - Live drive state fetched via `loadDriveStatus()` from `membership_config.is_drive_open` (and demo storage).
  - When closed, all CTAs across the site adapt automatically to point to IEEEXtreme 20.0, and applicants navigating to `/membership/register`, `/membership/profile`, or `/membership/chapters` are protected by route guards displaying an official closure notice with instant pathways to the Member Portal and IEEEXtreme.

---

### 🛡️ 2. Executive Admin Management Suite
- **Admin Sign-In** (`/admin/login`): Gated login with demo shortcuts in local testing and strict whitelist authentication (`admin_whitelist`) in live mode.
- **Orders Verification Dashboard** (`/admin/orders`):
  - **KPI Metrics**: Total Orders, Pending Reviews, Verified Members, and Total Funds Collected.
  - **Search & Filters**: Instant filter by status (`All`, `Pending`, `Verified`, `Rejected`) and search by USN, Student Name, Order Ref, or UTR.
  - **Payment Proof Viewer**: Full modal image preview of uploaded transaction screenshots loaded via short-lived signed URLs.
  - **Verification Controls**: One-click **Verify** (promotes status to verified) and **Reject** (with student feedback prompt).
  - **Decoupled Receipt Dispatch**: On-demand **Send Receipt** button dispatches a professional HTML email with an official PDF receipt attachment. Tracks `receipt_sent` status, timestamp, and errors with retry support.
  - **Manual Receipt Generator** (`/api/admin/manual-receipt`): Modal allowing executives to issue official receipts for offline or cash payments, automatically logged in `issued_receipts` and `admin_audit_log`.
  - **Ledger Export**: One-click **Export to CSV** for offline administrative recordkeeping (formula-injection protected).
- **Executive Team Whitelist** (`/admin/team`):
  - Grant and revoke executive access by institutional email without altering past order verification audit trails.
- **Drive & Treasurer Settings** (`/admin/settings`):
  - Toggle live membership drive open/closed status (`is_drive_open`).
  - Configure base fee, payee UPI VPA, and payee name.
  - Configure branch treasurer credentials (name, role, phone, signature) rendered on official PDF receipts.
- **Global Announcement Banner Manager** (`/admin/announcement`):
  - Live preview, message editing, link URL, and toggle for the sitewide announcement bar.

---

### 🏛️ 3. Society Chapters & Affinity Groups
Interactive Bento grid showcasing all 5 technical chapters and affinity groups:
1. **IEEE Computer Society (CS)** — Fostering innovation, technical learning in computing & open-source initiatives.
2. **IEEE Power & Energy Society (PES)** — Clean Tech, Microgrids & Smart Energy.
3. **IEEE PELS & IES Chapter** — Power electronics, industrial electronics, VLSI, embedded systems & robotics.
4. **IEEE Women in Engineering (WIE)** — Mentorship, Leadership & STEM Advancement.
5. **IEEE Social Implications of Technology (SSIT)** — Tech Ethics, AI Governance & Humanitarian Engineering.

---

### 📱 4. Responsive & Accessible Design
- **Dark Theme Palette**: Sampled directly from the official BMSCE IEEE brand logo:
  - Primary Orange: `#F26625`
  - Orange Accent: `#FF5300`
  - Primary Navy: `#00377E`
  - Deep Navy: `#004993`
  - Sky Blue: `#18A4FE`
  - Dark Surfaces: `#0A0F1A` / `#12192B`
- Mobile hamburger navigation drawer with quick links to registration, chapters, member portal, and admin portal.

---

### ⚡ 5. IEEEXtreme 20.0 Registration & Proctor Gateway
A state-driven portal for the global 24-hour programming competition hosted on campus for BMSCE students (competing globally on October 31, 2026):
- **Lead-Delegated Registration Model** (`/ieeextreme/register`):
  - Only the Team Lead logs in to represent the squad, entering academic and contact information for 1 to 3 members (solo allowed, maximum 3).
  - Lead details feature an "Email (Associated with IEEE)" input used for official correspondence and auto-claiming organizer-created teams.
  - Collects essential campus stay logistics (USN, department, year of study, phone, email) for overnight computer lab access.
  - Alphanumeric team name format matching IEEE rules (`3–20` characters, unique across all teams).
- **Team Lead Dashboard** (`/ieeextreme/team`):
  - Dedicated authenticated view for the Team Lead to inspect roster details and track assigned faculty proctor credentials.
  - Direct workflow to complete registration on IEEE vTools (`https://xtreme.vtools.ieee.org/`) and permanently lock squad details with one click.
- **Dual-Database Membership Validation**:
  - Live verification via `/api/xtreme/validate-member` against legacy member lists (`ieee_member_2026`) and active profiles (`profiles`).
  - Cross-checks to prevent an IEEE member from registering on multiple teams concurrently.
- **Three-Stage Official Workflow**:
  1. *Stage 1 (Local Gateway)*: Team Lead registers the team on BMSCE IEEE (`/ieeextreme/register`), or organizers pre-create/bulk import the squad.
  2. *Stage 2 (Proctor Assignment)*: System automatically or administrators manually assign an authorized faculty proctor from the directory.
  3. *Stage 3 (Official IEEE vTools)*: Team registers on `https://xtreme.vtools.ieee.org/` using their proctor credentials and confirms on `/ieeextreme/team`, permanently locking their squad.
- **Official Region 10 20.0 Edition Visuals**:
  - High-resolution logos (`public/ieeextreme/xtreme-logo-light.png`, `xtreme-logo-dark.png`, webp formats, and glow variants).
  - Ambient watermarks, official Region 10 badges, and branding integrated across the landing page (`/ieeextreme`), registration wizard (`/ieeextreme/register`), gateway confirmation (`/ieeextreme/success`), team lead dashboard (`/ieeextreme/team`), and homepage spotlight.
- **Executive Administration** (`/admin/xtreme`):
  - **Managed Faculty Proctors**: Register faculty proctors with per-proctor squad limits, filled in queue order and enforced concurrently at the database level.
  - **Single Squad Creation & Wide-Format Bulk CSV Import**: Organizers can pre-register teams with or without teammates. Organizer-created teams start in an unclaimed state and auto-claim seamlessly when the lead logs in with their verified email.
  - **Full Squad Roster Editing**: Dynamically edit team names, add or remove members (1–3 members), reassign the squad lead with automatic ownership reset, edit member credentials, and copy all squad emails with one click.
  - **Proctor Reassignment & Unassignment**: Reassign teams between eligible proctors or safely unassign back to `Pending Proctor`.
  - **CSV Upload & Full Data Export**: Pre-populate legacy member records (`ieee_member_2026`) and export complete team rosters with logistics for lab seating, campus security permissions, and meals.
- **Safe Database Migrations**:
  - `supabase/migrations/20261016140000_ieeextreme_tables.sql`: Base tables (`ieee_member_2026`, `xtreme_teams`, `xtreme_members`), RLS policies, and team registration RPC.
  - `supabase/migrations/20261019120000_xtreme_proctors_and_ownership.sql`: Managed proctors table (`xtreme_proctors`), nullable team ownership with auto-claim by verified email, and concurrency-safe proctor capacity enforcement procedures (`assign_proctor_to_team`, `auto_assign_proctor`).
  - `supabase/migrations/20261019160000_harden_sac_rls.sql`: Row-Level Security hardening ensuring SAC roles have full admin ownership on `xtreme_*` tables while keeping membership and financial tables read-only.
  - `supabase/migrations/20261019170000_xtreme_proctor_capacity_queue.sql`: Per-proctor squad caps, sequential fill queue, and the live proctor seeds.
  - `supabase/migrations/20261024194500_import_squads_and_namratha_proctor.sql`: Registration of Dr. Namratha M in proctor queue and idempotent squads roster import.
  - Additive tables only; zero modifications to existing membership or payment tables. Full demo-mode localStorage fallback supported when Supabase tables are pending.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/BMSCE-IEEE-SB/website.git
cd website
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
npm test
```
Runs the full Vitest suite (49 unit and integration tests covering proctors, teams API, SAC role permissions, and membership configuration).

### 4. Database Backups
```bash
node scripts/backup_database.mjs
```
Dumps a full JSON snapshot of all 17 public database tables to `backups/backup_<timestamp>/`.

---

## 🧪 Demo & Testing Credentials

The application includes built-in offline/demo sessions, allowing complete testing without waiting for database provisioning:

| Portal | URL | Demo Email | Demo Password | Quick Action |
|---|---|---|---|---|
| **Member Registration** | `/membership/register` | `test@bmsce.ac.in` | `password123` | Click **"Quick Demo Login"** |
| **Executive Admin** | `/admin/login` | `admin@bmsce.ac.in` | `adminpassword` | Click **"Demo Login"** |

---

## 🗄️ Database Setup (Supabase)

When connecting your live Supabase project:
1. Back up the project and review the existing `public` schema and policies.
2. For a fresh project, execute `supabase/schema.sql`. For either a fresh or existing project, then execute `supabase/migrations/20260927003133_security_remediation.sql` in the SQL editor. This migration preserves existing orders and profiles, privatizes payment screenshots, and introduces auditable receipt numbering. Do not run `schema.sql` over a live database as a migration.
3. Admin access is provisioned through `admin_whitelist`; do not insert directly into `admins`. Existing whitelist entries are retained and active users are synchronized by the migration.
4. Update `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-secret>

# Transactional Receipt Email (Nodemailer SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=ieee.sb@bmsce.ac.in
SMTP_PASS=your-app-password
SMTP_PORT=465
SMTP_FROM="BMSCE IEEE" <ieee.sb@bmsce.ac.in>
```

The service-role key must remain server-only: never rename it with a `NEXT_PUBLIC_` prefix. All checkout submissions, proof uploads, status mutations, manual receipts, settings updates, and admin tasks are processed strictly through server API endpoints (`/api/checkout/*` and `/api/admin/*`) utilizing this secret key. Direct client-side writes to sensitive tables are blocked by Supabase Row-Level Security. Deploy the application only after the migration succeeds, and verify registration, proof upload, admin verification, receipt delivery, manual-receipt auditing, and denial of direct client writes. Keep the Supabase backup until those checks pass.

---

## 📦 Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **QR Generation**: `qrcode.react`
- **PDF Generation**: `pdf-lib` (programmatic branded A4 PDF receipt generation)
- **Email**: Nodemailer (SMTP with PDF receipt attachment)
- **Database / Auth**: Supabase (PostgreSQL, Supabase Auth, Storage) with RLS hardening & audit logs
- **Deployment**: Vercel

---

## 📄 License
Maintained by **BMSCE IEEE Student Branch** (Region 10).
