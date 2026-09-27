# PRD — BMSCE IEEE Student Branch Website & Membership Portal

**Prepared for:** BMSCE IEEE Student Branch (Branch 06261, Region 10)  
**Production Site:** https://sb-website-theta.vercel.app/  
**Repository:** https://github.com/BMSCE-IEEE-SB/website  
**Target Ship Date:** 27 September 2026 (Annual Membership Drive)  
**Doc Status:** v3.5 (Post-Remediation & Full Admin Suite) — supersedes v2.0 and v1.0.

---

## 1. Executive Summary & Objective

The BMSCE IEEE Student Branch requires a unified digital presence to drive and manage its **2026 Annual Membership Drive**, highlight its 5 technical society chapters, showcase campus events and hackathons, and provide an auditable administrative platform for dues reconciliation.

### Primary Objectives (P0)
1. **Unified Public Presence**: A responsive, branded landing page showcasing branch history, chapter verticals, events carousel, photo gallery, executive committee, and membership benefits.
2. **End-to-End Membership Flow**:
   - Account creation and academic profiling (`/membership/register` → `/membership/profile`).
   - Dynamic chapter cart with fee slip calculator and T-shirt merchandise size selection (`/membership/chapters`).
   - Server-validated checkout intent and dynamic client-side UPI QR code generation (`/membership/checkout`).
   - Private payment screenshot proof upload and UTR reference submission.
   - Member self-service portal (`/account`) with real-time status tracking, digital membership card, and interactive resubmission for rejected orders.
3. **Executive Admin Management Suite**:
   - Orders verification dashboard (`/admin/orders`) with payment proof inspection via secure signed URLs.
   - Decoupled receipt email workflow: approve applications immediately, and dispatch official receipts on-demand.
   - Programmatic high-fidelity PDF receipt generator (`pdf-lib`) attached to transactional emails.
   - Manual receipt generator (`/api/admin/manual-receipt`) for offline/cash dues with sequential numbering (`BMSCE-IEEE-YYYY-XXXX`).
   - Events & workshops manager (`/admin/events`) for dynamic event CRUD.
   - Sitewide announcement banner editor (`/admin/announcement`).
   - Executive team whitelist (`/admin/team`) for role-based access control.
   - Branch settings (`/admin/settings`) for drive status, base fee, UPI VPA, and treasurer credentials.
4. **Hardened Security Architecture**:
   - Zero direct client writes to orders, config, events, or admin tables; all mutations are mediated by authenticated server API routes utilizing the service role key.
   - Comprehensive audit logging (`admin_audit_log`) and atomic receipt numbering (`receipt_counters`, `issued_receipts`).

---

## 2. User Roles & Personas

| User Role | Permissions & Core Workflows |
|---|---|
| **Prospective Member** | Browse landing page, calculate fees, create an account, fill profile details, select chapters and T-shirt size, scan UPI QR to pay, upload screenshot proof, and submit order. |
| **Enrolled / Verified Member** | Sign in at `/login`, view digital membership card and verification status at `/account`, resubmit corrected proof/UTR if rejected, and receive official PDF receipt via email. |
| **Branch Executive / Chair** | Sign into `/admin/login`, review pending orders and inspect proofs, approve or reject applications, dispatch official PDF receipts, generate manual receipts for offline dues, manage team whitelist, configure drive parameters, and publish announcements. |
| **Campus Event Attendee** | Browse upcoming workshops, summits, and hackathons (e.g. IEEEXtreme, Phase Shift) with external registration links. |

---

## 3. System Scope & Feature Specification

### 3.1 Student Membership Flow
1. **Authentication**: Supabase Auth (email + password) with email verification screen and password reset (`/login/reset`). Demo mode provides 1-click test credentials when unconfigured.
2. **Academic & Personal Profile**: Name, USN, Institutional Email, Department, Year of Study, Contact Phone, and optional IEEE Member ID.
3. **Chapter Shopping Cart**:
   - Base membership fee fixed at ₹1,810.
   - 5 Technical Chapters & Affinity Groups: Computer Society (₹100), Power & Energy Society (₹100), Power & Industrial Electronics (₹100), Women in Engineering (₹50), and Social Implications of Technology (₹50).
   - T-shirt size picker (`S`, `M`, `L`, `XL`, `XXL`) stored on order.
   - Real-time running total and departmental suggested bundles.
4. **Checkout & Payment**:
   - Server-validated checkout intent (`/api/checkout/intent`) recalculating prices on the server.
   - Dynamic client-side UPI intent QR generation (`upi://pay?pa=...&am=...&tn=...`).
   - Single-click Copy UPI ID, Copy Amount, and Download QR PNG buttons.
   - Secure payment proof screenshot upload (`/api/checkout/proof`) with server-side MIME and size checks (5MB limit).
   - Final submission via `/api/checkout/submit` creating order with `pending` status.
5. **Member Account Portal (`/account`)**:
   - Real-time status badge (`Pending Verification`, `Verified`, `Action Required`).
   - Interactive resubmission modal (`/api/checkout/resubmit`) allowing rejected applicants to re-upload proof and correct UTR without losing order continuity.

### 3.2 Executive Admin Management Suite
1. **Orders Dashboard (`/admin/orders`)**:
   - KPI metrics: Total Orders, Pending Reviews, Verified Members, Total Funds Collected.
   - Status filters (`All`, `Pending`, `Verified`, `Rejected`) and multi-parameter search (USN, Name, Order Ref, UTR).
   - Modal proof viewer fetching short-lived signed URLs from private storage.
   - Approval & Rejection (with customizable student feedback dialog).
   - **Decoupled Receipt Dispatch**: Dedicated "Send Receipt" button triggering `/api/send-receipt` with live delivery status and retry options.
   - **Manual Receipt Generator**: Modal dialog to issue official sequential receipts for offline/cash payments.
   - **Sanitized CSV Ledger Export**: Formula-injection protected export of complete registration records.
2. **Events Manager (`/admin/events`)**:
   - Full CRUD management for workshops, hackathons, summits, and talks.
   - Featured event toggle synchronizing with homepage hero carousel.
3. **Executive Team Access (`/admin/team`)**:
   - Whitelist management (`admin_whitelist`) adding authorized emails and roles (`admin`, `chair`).
   - Non-cascading revocation preserving past verification audit trails.
4. **Drive & Treasurer Settings (`/admin/settings`)**:
   - Toggle membership drive open/closed status.
   - Configure base fee, payee UPI VPA, and payee name.
   - Configure branch treasurer credentials (name, role, phone, signature) rendered on PDF receipts.
5. **Sitewide Announcement Banner (`/admin/announcement`)**:
   - Toggle banner visibility, edit copy and target URL with protocol sanitization.

---

## 4. Information Architecture & Route Tree

```
Public Web Routes:
├── /                                  (Homepage: Hero, Chapters, Events, ExeCom, Partners)
├── /chapters/[slug]                   (Chapter Detail: CS, PES, PELS-IES, WIE, SSIT)
├── /gallery                           (Photo Gallery with Lightbox)
├── /membership                        (Membership Overview, Fee Slip Calculator, FAQ)
├── /membership/register               (Step 1: Account Creation & Sign Up)
├── /membership/profile                (Step 2: Personal & Academic Details)
├── /membership/chapters               (Step 3: Chapter Add-ons & T-Shirt Size)
├── /membership/checkout               (Step 4: Dynamic UPI QR & Proof Upload)
├── /login                             (Member Portal Sign In)
├── /login/reset                       (Password Reset Request)
├── /account                           (Member Portal: Digital Card, Status, Resubmission)
├── /privacy                           (Official Privacy Policy)
├── /terms                             (Terms of Service & Code of Ethics)
└── /refund                            (Dues Refund & Rejection Policy)

Executive Admin Routes:
├── /admin/login                       (Admin Sign In)
├── /admin                             (Dashboard Redirect)
├── /admin/orders                      (Orders Verification & Ledger)
├── /admin/announcement                (Sitewide Announcement Banner Editor)
├── /admin/events                      (Events & Workshops Manager)
├── /admin/team                        (Executive Whitelist & Role Management)
└── /admin/settings                    (Drive, Fee, UPI & Treasurer Settings)

Server API Endpoints:
├── /api/checkout/intent               (POST: Validate cart and generate checkout intent)
├── /api/checkout/proof                (POST: Authenticated upload of payment proof)
├── /api/checkout/submit               (POST: Finalize order and allocate receipt number)
├── /api/checkout/resubmit             (POST: Resubmit proof for rejected orders)
├── /api/send-receipt                  (POST: Generate PDF and dispatch receipt email)
├── /api/admin/orders/[id]/status      (PATCH: Verify or reject order)
├── /api/admin/manual-receipt          (POST: Issue manual receipt for offline dues)
├── /api/admin/announcement            (PATCH: Update global announcement banner)
├── /api/admin/events                  (POST/PUT/DELETE: CRUD branch events)
├── /api/admin/settings                (PATCH: Update drive settings and treasurer profile)
└── /api/admin/team                    (POST/DELETE: Manage executive whitelist)
```

---

## 5. Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **QR Code Engine**: `qrcode.react`
- **PDF Generation Engine**: `pdf-lib` (programmatic vector/text A4 PDF receipt generation)
- **Transactional Email**: Nodemailer (SMTP with PDF attachment)
- **Backend & Database**: Supabase (PostgreSQL 15, Supabase Auth, Private Storage)
- **Security**: Row-Level Security (RLS) hardening, server API mediation (`SUPABASE_SERVICE_ROLE_KEY`), signed storage URLs
- **Deployment**: Vercel

---

## 6. Visual Identity & Brand System

Sampled directly from the official BMSCE IEEE brand logo:

| Role | Color Name | Hex Code | Purpose |
|---|---|---|---|
| Primary Brand | IEEE Orange | `#F26625` | Primary CTA buttons, brand badges, active highlights |
| Brand Accent | Bright Orange | `#FF5300` | Hover states, gradients, glowing nodes |
| Primary Dark | IEEE Navy | `#00377E` | Dark card backgrounds, borders, secondary badges |
| Deep Brand | Deep Navy | `#004993` | Card headers, table borders |
| Sky Accent | Sky Blue | `#18A4FE` | Subtle accents, status pills, links |
| Background | Charcoal Slate | `#0A0F1A` | Root page background |
| Surface | Midnight Navy | `#12192B` | Modals, cards, elevated surfaces |
| Text Primary | Warm White | `#E7ECF5` | Headings, primary body copy |
| Text Muted | Slate Grey | `#8B95A8` | Subtitles, helper text, form labels |

---

## 7. Database Architecture & Schema

```sql
-- 1. Profiles (1:1 with Supabase Auth users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  usn text NOT NULL,
  email text NOT NULL,
  department text NOT NULL,
  year_of_study text,
  phone text,
  ieee_member_id text,
  created_at timestamptz DEFAULT now()
);

-- 2. Chapters (6 Technical Societies & Affinity Groups)
CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  slug text,
  price numeric NOT NULL CHECK (price >= 0),
  description text,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0
);

-- 3. Membership Configuration & Treasurer Info
CREATE TABLE public.membership_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_fee numeric NOT NULL,
  payee_vpa text NOT NULL,
  payee_name text NOT NULL,
  drive_year int DEFAULT 2026,
  is_drive_open boolean DEFAULT true,
  treasurer_name text DEFAULT 'Neha Ramiah',
  treasurer_role text DEFAULT 'Treasurer and MDC',
  treasurer_phone text DEFAULT '+91 6385525264',
  signature_url text
);

-- 4. Executive Whitelist & Admins
CREATE TABLE public.admin_whitelist (
  email text PRIMARY KEY,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'admin'
);

-- 5. Orders Ledger
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  base_fee numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  payment_screenshot_url text,
  utr_reference text,
  order_reference text UNIQUE NOT NULL,
  receipt_number text UNIQUE,
  drive_year int DEFAULT 2026,
  tshirt_size text,
  receipt_sent boolean DEFAULT false,
  receipt_sent_at timestamptz,
  receipt_error text,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason text
);

-- 6. Order Items (Chapters selected per order)
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES public.chapters(id) NOT NULL,
  price_at_purchase numeric NOT NULL
);

-- 7. Checkout Intents (Server-side price validation)
CREATE TABLE public.checkout_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_reference text NOT NULL UNIQUE,
  drive_year int NOT NULL,
  base_fee numeric NOT NULL CHECK (base_fee >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  chapter_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz NOT NULL,
  submitted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Sequential Receipt Counters & Issued Receipts
CREATE TABLE public.receipt_counters (
  drive_year int PRIMARY KEY,
  last_number bigint NOT NULL DEFAULT 0 CHECK (last_number >= 0)
);

CREATE TABLE public.issued_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  drive_year int NOT NULL,
  sequence_number bigint NOT NULL,
  kind text NOT NULL CHECK (kind IN ('order', 'manual')),
  order_id uuid UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  recipient_email text NOT NULL,
  student_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  chapters text[] NOT NULL DEFAULT '{}',
  reason text,
  delivery_status text NOT NULL DEFAULT 'reserved' CHECK (delivery_status IN ('reserved', 'sent', 'failed')),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (drive_year, sequence_number)
);

-- 9. Administrative Audit Trail
CREATE TABLE public.admin_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Announcements & Events
CREATE TABLE public.announcement (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  message text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.events (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('workshop', 'hackathon', 'summit', 'talk')),
  chapter text NOT NULL,
  date date NOT NULL,
  time text,
  venue text NOT NULL,
  image text NOT NULL,
  description text NOT NULL,
  registration_url text DEFAULT '#',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

---

## 8. Key Workflows & Sequences

### 8.1 Student Registration & Payment Flow
1. Visitor navigates to `/membership/register`, enters email/password.
2. Completes profile at `/membership/profile` (Full Name, USN, Department, Phone).
3. At `/membership/chapters`, selects society chapters and picks a T-shirt size (`S`, `M`, `L`, `XL`, `XXL`).
4. At `/membership/checkout`:
   - System calls `/api/checkout/intent` to calculate and freeze total amount on the server.
   - Client renders dynamic UPI QR code (`qrcode.react`) with UPI intent string (`upi://pay?pa=...&am=...&tn=BMSCE-XXXXXX`).
   - Student scans with any UPI app (GPay, PhonePe, Paytm), completes payment, and takes a screenshot.
   - Uploads screenshot via `/api/checkout/proof` (validated for MIME type and <= 5MB) to private storage.
   - Inputs 12-digit UTR and clicks **"Submit Payment Proof"** (`/api/checkout/submit`).
   - Order is created with status `pending`, unique order reference, and allocated receipt number.

### 8.2 Admin Verification & Receipt Dispatch
1. Admin logs into `/admin/orders`, filters by `Pending`.
2. Clicks **"View Proof"** to inspect uploaded payment receipt via short-lived signed URL.
3. Cross-checks UTR and credit amount in branch bank statement.
4. Clicks **"Verify"** (`/api/admin/orders/[id]/status`):
   - Order status flips to `verified`.
   - `verified_at` and `verified_by` are permanently timestamped.
   - Member portal immediately displays confirmed status and digital card.
5. Executive clicks **"Send Receipt"** (`/api/send-receipt`):
   - Generates official PDF receipt with student details, USN, itemized dues, sequential receipt number, and treasurer credentials.
   - Dispatches transactional email with attached PDF.
   - Dashboard logs receipt delivery timestamp and status.

### 8.3 Order Rejection & Resubmission
1. If screenshot is invalid or UTR is missing, admin clicks **"Reject"** and provides clear guidance.
2. Order status updates to `rejected` with `rejection_reason`.
3. Student logs into `/account`, reads admin feedback, and clicks **"Resubmit Clear Payment Proof"**.
4. Uploads clean proof and corrected UTR via `/api/checkout/resubmit`. Order status returns to `pending` without duplicate entries.

---

## 9. Security & Compliance Implementation

1. **Strict Server API Mediation**: Direct client mutations to `orders`, `order_items`, `membership_config`, `announcement`, `events`, and `admin_whitelist` are blocked by PostgreSQL Row-Level Security. All writes must pass through validated Next.js API routes with service role authentication.
2. **Payment Proof Isolation**: Screenshots are stored in a private Supabase Storage bucket (`public-assets`), accessible only by the owning student and administrators via short-lived signed URLs.
3. **Audit Log & Tamper Resistance**: All administrative mutations are recorded in `admin_audit_log`. Receipt numbers are generated from atomic counter sequences in `receipt_counters` and recorded in `issued_receipts`.
4. **Formula Injection Sanitization**: All CSV ledger exports strip leading dangerous characters (`=`, `+`, `-`, `@`) to protect administrative spreadsheets.

---

## 10. Acceptance Criteria Checklist (All Fulfilled)

- [x] Multi-step student registration with profile details, 6-chapter cart, and T-shirt size picker.
- [x] Dynamic client-side UPI QR generation with server-verified checkout intent.
- [x] Secure private storage upload for payment proof with server-side validation.
- [x] Member self-service portal with status tracker, digital card, and interactive resubmission.
- [x] Complete Executive Admin Suite: Orders, Announcements, Events, Team Whitelist, and Settings.
- [x] Decoupled receipt email workflow with on-demand dispatch and delivery state tracking.
- [x] Programmatic branded PDF receipt generator attached to emails and manual receipt issuance.
- [x] Manual receipt generator modal for offline and cash dues with audit tracking.
- [x] Row-Level Security hardening and server API mediation across all mutation pathways.
- [x] Dark brand theme sampled from official BMSCE IEEE logo palette.
- [x] Clean Next.js 16 App Router build with 32+ routes and zero TypeScript errors.