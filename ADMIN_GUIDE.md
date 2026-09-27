# BMSCE IEEE Admin Guide

For student executive committee members, branch chairs, treasurers, and volunteers responsible for managing the website, verifying membership dues, running the membership drive, scheduling technical events, publishing announcements, and configuring branch finances.

---

## 🧭 Admin Portal Architecture

The administrative portal features a unified sidebar navigation shell (responsive bottom tab bar on mobile devices) organizing all administrative operations into eight dedicated modules:

1. **Overview (`/admin`)**: Real-time financial metrics, pending queue age, verification trends, priority attention items, and interactive SVG charts with data table views.
2. **Applications (`/admin/orders`)**: Financial ledger for reviewing payment proofs, fraud warning flags (duplicate UTR, amount mismatch, repeat USN), sliding inspection drawer, keyboard shortcuts, bulk verification/rejection, and on-demand official PDF receipts.
3. **Members Directory (`/admin/members`)**: Verified membership roster, chapter enrollment breakdown tiles, credential dispatch tracking (`credentials_sent_at`), inline IEEE member ID assignment, and headquarters CSV export.
4. **Events & Workshops (`/admin/events`)**: Create, edit, feature, and archive branch workshops, hackathons, summits, and technical talks.
5. **Sitewide Announcement (`/admin/announcement`)**: Toggle and edit the global alert banner with live preview and safe URL validation.
6. **Executive Team Access (`/admin/team`)**: Role-based access control whitelist (`admin_whitelist`) to grant or revoke administrative privileges with automatic database trigger synchronization.
7. **Fees & Payment (`/admin/settings`)**: Configure membership drive status (`is_drive_open`), base membership fee, chapter add-ons, UPI VPA, payee name with live QR tester, and treasurer credentials printed on receipts.
8. **Activity Log (`/admin/activity`)**: Searchable, exportable audit trail recording every administrative verification, rejection, private note, settings change, and whitelist update.

---

## 🔑 Signing In

1. Navigate to: **`/admin/login`** (or click the **[Admin]** / **[Executive login]** link in the site footer).
2. Enter your authorized administrator email and password.
   - *In live mode*, authentication requires an account in Supabase Auth matching an entry in `admin_whitelist`.
   - *For local development & offline testing*, click **"Demo Login"** or use `admin@bmsce.ac.in` / `adminpassword` to explore with 46 realistic sample applications.
3. Upon authentication, you will be redirected to the **Overview** dashboard (or the specific admin page you originally requested).
4. To sign out, click the **"Sign out"** button in the sidebar bottom user card.

---

## 📊 Overview (`/admin`)

A complete executive snapshot of the membership drive:

- **Verified Funds**: Total monetary amount (₹) collected and cleared for the branch.
- **Pending Funds & Queue Age**: Total dues awaiting verification and the wait time of the oldest pending application.
- **Verified Members**: Total approved members with a 14-day rolling verification trend line.
- **Weekly Intake**: New applications received this week compared with the preceding week.
- **Needs Attention Queue**: High-priority applications displaying automatic fraud flags followed by the oldest pending orders. Click any item to inspect it immediately.
- **Interactive SVG Charts**:
  - *Daily Applications & Verifications* (14-day timeline).
  - *Application Status Distribution* (Pending, Verified, Rejected).
  - *Society & Chapter Add-on Enrollments* (CS, PES, PELS/IES, WIE, SSIT).
  - *Department Breakdown* (CSE, ISE, ECE, EEE, ME, etc.).
  - *Year of Study Distribution* (1st, 2nd, 3rd, 4th Year).
  - *Accessible Data Tables*: Every chart includes a **Table** toggle button to view raw counts and exact figures.
- **Recent Activity Feed**: The latest actions taken across the entire executive committee.

---

## 📋 Verifying Membership Applications (`/admin/orders`)

The `/admin/orders` dashboard is your financial ledger and verification workspace.

### 1. Finding & Filtering Applications
- **Status Tabs**: Filter between **Pending**, **Verified**, **Rejected**, and **All**.
- **Search Bar**: Instant full-text search across student name, USN, order reference, UTR number, or phone.
- **Filters**: Filter by chapter affiliation, academic department, and submission date range (Last 7 days, 30 days, or All time).
- **Needs a Closer Look**: One-click filter isolating applications flagged with review warnings.
- **Sorting & Pagination**: Sort by newest, oldest, or amount with clean 25-order pagination.

### 2. Automated Fraud & Verification Warnings
The system automatically scans orders and highlights critical issues before approval:
| Warning Flag | Risk & Description | Action Required |
|---|---|---|
| **Duplicate UTR** | The same 12-digit UTR exists on multiple applications. | High fraud risk. Inspect both orders; check bank statements to ensure dues were not credited only once. |
| **Amount Mismatch** | Total paid does not match base fee plus selected chapter add-ons. | Verify if the student underpaid. If underpaid, reject with clear notes. |
| **Repeat Student** | The same USN has multiple active applications. | Check whether the student re-applied instead of updating an existing rejected application. |

*Safety Guard*: Verifying an order with active warnings opens a "Verify with warnings?" confirmation modal detailing every flagged risk.

### 3. Reviewing an Individual Application
Click any row to open the sliding **Detail Drawer**:
- **Signed Payment Proof**: View the high-resolution payment screenshot retrieved securely via a short-lived signed URL. Click to zoom in/out.
- **UTR / Bank Reference**: Displays the 12-digit transaction number with a one-click **Copy** button for quick lookup in your banking portal.
- **Student Profile**: Full name, USN, department, year of study, phone, and institutional email with a mailto link.
- **Merchandise & Chapter Add-ons**: Selected T-shirt size (`S`, `M`, `L`, `XL`, `XXL`) and society chips.
- **Timeline**: Visual chronological track from submission, verification/rejection, to credential issuance.
- **Private Admin Notes**: Record internal notes visible only to executives (e.g. *"Bank statement checked 14 Oct; credit confirmed"*).

### 4. Approving an Application (Verify)
1. Verify the UTR, payee, amount, and date against the branch bank statement or merchant UPI app.
2. Click **"Verify payment"** (or press shortcut `v`).
3. The student's status updates immediately to **Verified Member**.

### 5. On-Demand Official PDF Receipts (`pdf-lib`)
- Official receipts are decoupled from verification to support high-volume reconciliation and offline operation.
- Once verified, open the order detail drawer and click **"Send official PDF receipt"**.
- The backend allocates a sequential receipt number (`BMSCE-IEEE-YYYY-XXXX`), programmatically generates a vector-crisp A4 PDF containing branch seals, fee itemization, and treasurer signatures, and dispatches it via email.
- Live delivery status (`delivery_status`, `sent_at`, `last_error`) is tracked with retry support.

### 6. Rejecting an Application (Action Required)
If proof is cropped, illegible, or incorrect:
1. Click **"Reject"** (or press shortcut `r`).
2. Select a quick preset reason or enter custom guidance.
3. The student receives clear feedback in their `/account` portal with a **"Resubmit Clear Payment Proof"** action to upload valid proof without paying again.

### 7. Keyboard Shortcuts
Navigate at high speed during peak drives:
| Key | Action |
|---|---|
| `j` / `k` | Move cursor down / up |
| `Enter` | Open highlighted application |
| `v` | Verify highlighted application |
| `r` | Reject highlighted application |
| `x` | Toggle selection for bulk actions |
| `/` | Focus search bar |
| `Esc` | Close detail drawer / modal |
| `?` | Show keyboard shortcuts modal |

### 8. Bulk Operations & CSV Export
- Tick multiple orders (or press `x`) to activate the bulk action bar.
- Perform batch verification, batch rejection, or export selected applications.
- Click **"Export"** to download an injection-sanitized CSV file compatible with Excel and Google Sheets.

---

## 👥 Members Directory (`/admin/members`)

Comprehensive directory of all students whose membership has been approved:

- **Chapter Enrollment Tiles**: Real-time member count for Computer Society, PES, PELS/IES, WIE, and SSIT. Click any tile to filter.
- **IEEE Member ID Assignment**: Click into the "IEEE member ID" column to enter or update the global IEEE 8-digit membership number directly. Saves automatically on blur.
- **Credential Dispatch Tracking**: Track who has received their IEEE.org login credentials. Click an individual status badge or select multiple members and click **"Credentials sent"**.
- **BCC Email All**: Click **"Email"** to launch your desktop mail client with all filtered members pre-filled in the BCC field.
- **Export Official Roster**: Download sanitized CSV rosters formatted for submission to IEEE Bangalore Section and Region 10.

---

## 🗓️ Events & Workshops Manager (`/admin/events`)

Manage branch events, hackathons, and seminars displayed across the site:

1. **Event List**: Browse all branch events categorized by category (*workshop*, *hackathon*, *summit*, *talk*) with chapter affiliation, date, and venue.
2. **Adding an Event**:
   - Click **"Add Event"**.
   - Fill in Title, Category, Chapter, Date (`YYYY-MM-DD`), Time, and Campus Venue.
   - Enter Cover Image URL (Unsplash or hosted asset).
   - Enter Registration URL (Devfolio, Unstop, Google Form).
   - Toggle **Featured** to pin the event on the homepage hero showcase.
3. **Editing & Deleting**: Modify event details or remove past events instantly.

---

## 📢 Sitewide Announcement (`/admin/announcement`)

Control the prominent alert banner shown across the top of all public pages:

1. **Toggle Visibility**: Switch the announcement banner on or off.
2. **Message Copy**: Enter the notification message (e.g. *"Membership Drive 2026 is officially open! Early-bird society discounts end Sunday."*).
3. **Action Link**: Optional destination URL (internal path like `/membership` or external `https://` link). Malicious or unsafe protocols are blocked.
4. **Live Preview**: Inspect the banner rendered exactly as it appears on desktop and mobile screens before publishing.

---

## 🛡️ Executive Team Access & Whitelist (`/admin/team`)

Manage access privileges for the executive committee:

1. **Authorized Whitelist**: View all active administrators and their designated roles (`chair`, `treasurer`, `admin`, etc.).
2. **Authorizing an Executive**:
   - Enter the student leader's institutional email (e.g., `executive@bmsce.ac.in`).
   - Select their designated role.
   - When the executive signs up or logs into `/admin/login`, database triggers automatically grant administrative permissions.
3. **Revoking Privileges**: Click the trash icon to revoke access.
   - *Audit Safety*: Historical order verification records remain permanently linked via foreign key audit trails.

---

## ⚙️ Fees & Payment Settings (`/admin/settings`)

Configure the financial parameters of the membership drive:

1. **Drive Status**: Toggle whether membership applications are open or closed.
2. **Base Membership Fee (₹)**: Mandatory branch membership fee.
3. **Chapter Add-ons (₹)**: Individual dues for CS, PES, PELS/IES, WIE, and SSIT.
4. **Branch UPI ID & Payee Name**: Configure the branch VPA (e.g. `bmsceieee@okhdfcbank`) and registered account title.
5. **Interactive UPI QR Tester**: Scan the test QR with a mobile phone to confirm bank account name and amount before saving.
6. **Treasurer Credentials**:
   - Full Name, Designation, and Contact Phone.
   - Printed automatically on all generated official PDF receipts and invoices.

---

## 📝 Activity & Audit Log (`/admin/activity`)

Immutable, permanent record of every administrative action taken on the platform:
- Verification and rejection timestamps with administrator email.
- Changes to private admin notes.
- IEEE member ID assignments and credential tracking updates.
- Settings modifications, fee adjustments, and announcement banner updates.
- Filter by action type, search by target order or user, and export audit trails to CSV.

---

## 🔒 Security Best Practices

1. **Verify Against Bank Statements**: Always reconcile incoming UTR references against the merchant bank statement or UPI transaction history, never solely on the uploaded screenshot.
2. **Investigate Duplicate UTR Warnings**: Never approve an application flagged with duplicate UTR without cross-referencing all associated orders.
3. **Protect Service Role Secrets**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses PostgreSQL Row-Level Security. It must remain strictly in server environment variables and never be exposed in client code or repositories.
4. **Shared Campus Computers**: Always sign out from `/admin` when using campus lab workstations or shared committee laptops.
