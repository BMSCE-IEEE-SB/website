# Changelog

All notable changes to the **BMSCE IEEE Student Branch Website** will be documented in this file.

---

## [3.2.0] - 2026-09-27 (Chapter step & pricing)

### Changed
- `/membership` no longer asks students to pick chapters. The pricing block now shows the base price, what it includes and chapter add-on prices, next to a "try your card" preview. The name and department typed there carry into registration.
- The chapter step is rebuilt: colour tiles with photos, "Suggested" badges and a one-tap "add the picks for your department", tiles that expand to show activities, chips that pop onto the live card, an animated total with removable line items, and a sticky total bar on phones.

---

## [3.1.0] - 2026-09-27 (Dynamic redesign)

### Added
- Chapter detail pages at `/chapters/[slug]` with about, focus areas, signature activities, chapter events and a live countdown. Chapter cards now open these pages instead of the sign-up form.
- `/membership` overview page (the new target of "Become a member"): benefits, live price calculator, four-step guide and FAQ. Chapters picked in the calculator carry into registration.
- Separate member-portal sign-in at `/login`, with forgot-password and `/login/reset` for live mode.
- Session-aware header: shows the member's name and a menu when signed in, a chapters mega-menu, active-section highlighting, and hides while scrolling down.
- Interactive hero: brand-coloured node network that reacts to the cursor, rotating headline word, auto-cycling event deck with live countdown.
- Scrolling event ticker, expanding "Learn / Build / Compete / Lead" strip, auto-cycling chapter explorer, draggable events carousel with chapter filters, two-row moving gallery, member-voices carousel, tilting membership card, contact form that opens the visitor's email app, and a full `/gallery` page.
- Live membership card that fills in as students register; digital card, status tracker and quick links in the member portal; confetti on submission and verification.
- Password show/hide and strength meter, college-email hint, scroll progress bar, custom 404 page.

### Changed
- New visual identity: Archivo display type, warm paper background, the emblem's sails and dots as motifs, bolder use of brand orange and navy.
- Events now have real dates; "upcoming" and "past" are computed from today's date and refreshed hourly.

### Fixed
- The register page showed a sign-up form under a "you are signed in" note; signed-in visitors now get a clear continue / switch account choice.
- "Member portal" and "Become a member" both led to the same sign-up page.
- Event dates rendered a day early for visitors west of India, and server and browser could disagree on the date text.
- The focus outline changed rounded buttons into squares.
- The success banner on the portal disappeared in development because effects run twice.
- Price calculator overflowed narrow phone screens.

---

## [3.0.0] - 2026-09-27 (Merged website & redesign)

### Added
- Full landing page merged in from the `bmsce-ieee-website` repo: hero, about and metrics, six chapters, events with filters, photo gallery with lightbox, executive committee, membership call-to-action, partnerships and contact.
- "Become a member" in the header, hero, chapters and footer now opens the membership flow on the same site.
- Registration progress stepper across the four membership steps.
- "Open UPI app" button on phones at checkout.
- Row-level security policies, seed data and the missing `announcement` table in `supabase/schema.sql`.

### Changed
- New light, less boxy design system using the logo's orange, navy and sky blue with Space Grotesk and Inter. Works from 360px phones to wide laptops.
- Demo mode (no Supabase configured) is now explicit, and demo shortcuts never appear once Supabase is connected.
- Payment screenshots are stored in a private bucket and viewed by admins through short-lived signed URLs.

### Fixed
- Members saw every student's orders, including sample data, on their dashboard.
- Demo user ids changed on every sign-in, which detached orders from their owner.
- Admin access could be gained by setting a localStorage key, or by any login when the network failed.
- Any email/password was accepted when Supabase was offline.
- Supabase errors on profile save, order insert and admin updates were silently ignored.
- Order reference changed on every checkout reload, so it no longer matched the QR the student paid against.
- Opening checkout directly charged a hard-coded ₹250 instead of sending the student to pick chapters.
- Chapter selections were never saved to `order_items`, so admins could not see them in live mode.
- Payment screenshots in demo mode were blob URLs that broke after a reload.
- No file type or 5 MB size check on uploads; UTR was not validated.
- Sample orders re-seeded whenever the list was empty.
- `/api/send-receipt` was an open mail relay with HTML injection. It now requires an admin session in live mode and escapes all input.
- CSV export was open to spreadsheet formula injection.
- Dismissed announcements came back on every page; unsafe `javascript:` links could be saved.
- Only three of the advertised chapters were offered in the cart.

---

## [2.1.0] - 2026-09-25

### Added
- **Legal & Trust Pages**:
  - `/privacy`: Official student privacy policy detailing data usage, USN/email storage, and security.
  - `/terms`: Membership eligibility, IEEE code of ethics, and duration rules.
  - `/refund`: Dues policy for verified orders, duplicate UPI charge resolution, and rejection resubmission terms.
  - Linked in global footer across all pages.
- **Documentation Suite**:
  - `.env.example`: Full template of environment variables for Supabase and Nodemailer.
  - `CONTENT_CHECKLIST.md`: Non-technical checklist for executive committee members to supply remaining text and assets.
  - `ADMIN_GUIDE.md`: Walkthrough for student volunteers verifying payments and managing announcements.
  - `DEPLOYMENT.md`: Vercel setup instructions and custom domain DNS cutover guide.
  - `CHANGELOG.md`: Dated phase-by-phase version history.

---

## [2.0.0] - 2026-09-25 (Phase 2 & Mobile Polish)

### Added
- **Responsive Mobile Navigation (`Navbar.tsx`)**:
  - Slide-down drawer with animated hamburger toggle for mobile devices.
  - Direct shortcuts to membership registration, chapter verticals, member dashboard, and admin portal.
- **Interactive Payment Resubmission Flow (`/account`)**:
  - Modal allowing students to re-upload clear transaction screenshots and corrected UTR references for rejected orders.
  - Automatically resets order status back to `Pending Verification`.
- **Checkout Polish (`/membership/checkout`)**:
  - Single-click **Copy UPI ID** and **Copy Amount** buttons for mobile payment execution.
  - Single-click **Download QR Code** button converting vector QR to high-resolution PNG.
- **Rich Chapters Bento Grid (`src/app/page.tsx`)**:
  - Asymmetrical card layout highlighting IEEE Computer Society (CS), PES, PELS/IES, WIE, and SSIT with badges, icons, and focus tracks.
- **Executive Admin Verification Portal (`/admin/orders`)**:
  - KPI metric cards: Total Orders, Pending Reviews, Verified Members, and Verified Funds (₹).
  - Search by USN, student name, order reference, or UTR, with status tab filters.
  - Modal image viewer for uploaded payment screenshots.
  - One-click **Verify** button triggering automated receipt email dispatch.
  - One-click **Reject** modal prompting for specific feedback.
  - **Export to CSV** button generating a clean registration ledger.
- **Announcement Banner System (`/admin/announcement` & `AnnouncementBar.tsx`)**:
  - Executive management interface with live site preview and toggle.
  - Dynamic top announcement banner across all public pages with dismissal support.

---

## [1.5.0] - 2026-09-25 (Phase 1.5 - PRD v2.0 Architecture)

### Added
- **Multi-Step Membership Flow**:
  - `/membership/register`: Minimal signup (Email, Password, Confirm Password) with email verification holding screen.
  - `/membership/profile`: Personal and academic profiling with auto-fill sample testing helper.
  - `/membership/chapters`: Dynamic chapter shopping cart calculating running totals with base membership fee.
  - `/membership/checkout`: Dynamic client-side UPI intent string generation (`upi://pay?pa=...`) and QR rendering via `qrcode.react`.
  - `/account`: Member portal for tracking verification progress (`Pending`, `Verified`, `Rejected`).
- **Nodemailer Transactional Receipt Route (`/api/send-receipt`)**:
  - Automated HTML email dispatch upon payment verification.
- **Database Architecture (`supabase/schema.sql`)**:
  - DDL for `profiles`, `chapters`, `membership_config`, `admins`, `orders`, and `order_items`.
- **Local Testing & Offline Suite**:
  - Pre-configured demo credentials (`test@bmsce.ac.in` / `password123` and `admin@bmsce.ac.in` / `adminpassword`).
  - Graceful fallback preventing `"Failed to fetch"` network crashes when Supabase is unconfigured.

---

## [1.0.0] - 2026-09-25 (Phase 1 - Scaffold & Theming)

### Added
- Scaffolding of Next.js 15 (App Router) + Tailwind CSS v4 + TypeScript.
- Configured official brand palette sampled from BMSCE IEEE logo:
  - Primary Orange (`#F26625`), Navy (`#00377E`), Sky Blue (`#18A4FE`), and Dark Surfaces (`#0A0F1A`, `#12192B`).
- Clean archival of legacy HTML/CSS/JS files into `legacy/`.
