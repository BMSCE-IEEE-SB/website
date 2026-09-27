# BMSCE IEEE Student Branch Website

Official website for the **IEEE Student Branch at B.M.S. College of Engineering (Branch 06261, Region 10)**. Built with Next.js 16 (App Router), Tailwind CSS v4, and Supabase for the 2026 Annual Membership Drive.

The public landing page (chapters, events, gallery, team, partnerships) and the membership registration flow live in one site. Every "Become a member" button leads to `/membership/register`.

### Demo mode vs live mode
- **Demo mode** runs when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set. Everything is stored in the browser's localStorage with sample admin data, any login works, and a blue "Demo mode" note appears on the forms.
- **Live mode** runs as soon as both variables are set. Demo shortcuts disappear, real Supabase Auth is required, and admin rights come only from the `admins` table.

### Main pages
| Page | What it is |
|---|---|
| `/` | Landing page (Hero, About, Chapters, Events, Gallery preview, ExeCom, Partners) |
| `/chapters/[slug]` | Chapter detail pages (`cs`, `pes`, `pels-ies`, `wie`, `ssit`) |
| `/gallery` | Full photo gallery with interactive lightbox |
| `/membership` | "Become a member": benefits, fee slip calculator, FAQ |
| `/membership/register` → `/profile` → `/chapters` → `/checkout` | The four-step registration flow (includes T-shirt size selection) |
| `/login` | Member portal sign in |
| `/login/reset` | Password reset request for member accounts |
| `/account` | Member portal: digital card, status tracker, payment resubmission |
| `/admin/login` | Executive administrator sign in |
| `/admin/orders` | Orders ledger, payment proof verification, and receipt dispatch |
| `/admin/events` | Events & workshops manager (CRUD) |
| `/admin/announcement` | Sitewide announcement banner editor |
| `/admin/team` | Executive team access & whitelist manager |
| `/admin/settings` | Membership drive status, base fee, UPI VPA & treasurer settings |
| `/privacy`, `/terms`, `/refund` | Official student branch legal & policy pages |

### Where to edit site content
All landing-page text, chapters, events, gallery photos, testimonials, FAQs and ExeCom members are in `src/data/site.ts`. Events marked as upcoming or past are worked out from their dates automatically. The testimonials and events there are **placeholders** and can be replaced or managed dynamically via `/admin/events`. Chapter prices for payment come from the `chapters` table in live mode.

---

## 🌟 Key Features

### 🎓 1. Multi-Step Student Membership Flow
- **Minimal Initial Sign-Up** (`/membership/register`): Email, password, and confirm password with an email verification gate.
- **Academic & Personal Profile** (`/membership/profile`): Full Name, USN, Department, Year of Study, Contact Info, and optional IEEE Member ID with auto-fill sample testing helper.
- **Dynamic Chapters Shopping Cart** (`/membership/chapters`):
  - Fixed Base Branch Membership fee (₹1,810).
  - Interactive add/remove for all 5 technical chapters and affinity groups (Computer Society, PES, PELS/IES, WIE, SSIT) with real-time total calculation.
  - **T-Shirt Size Selector**: Members select their merchandise size ('S', 'M', 'L', 'XL', 'XXL') directly in the cart.
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
- **Events Manager** (`/admin/events`):
  - Full CRUD operations for branch workshops, hackathons, summits, and technical talks.
  - Live toggle for featured events displayed on the homepage.
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
1. **IEEE Computer Society (CS)** — Software Architectures, Algorithms, AI Systems & IEEEXtreme.
2. **IEEE Power & Energy Society (PES)** — Clean Tech, Microgrids & Smart Energy.
3. **IEEE PELS & IES Joint Chapter** — PCB Fabrication, Power Drives & Industrial Automation.
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
SMTP_USER=ieee@bmsce.ac.in
SMTP_PASS=your-app-password
SMTP_PORT=465
SMTP_FROM="BMSCE IEEE" <ieee@bmsce.ac.in>
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
Maintained by **BMSCE IEEE Student Branch** (Branch 06261, Region 10).
