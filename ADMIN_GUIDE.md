# BMSCE IEEE — Executive Administrator Guide

This guide is for student executives, branch chairs, treasurers, and volunteers responsible for managing the website, verifying membership applications, managing branch events, publishing announcements, configuring drive settings, and issuing receipts.

---

## 🧭 Navigation & Admin Architecture

The Executive Administration suite is organized into five core modules accessible from the unified admin navigation header:

1. **Orders (`/admin/orders`)**: Verify payment proofs, approve or reject applications, dispatch on-demand official receipts, and export registration records.
2. **Announcements (`/admin/announcement`)**: Edit and toggle the sitewide global alert banner.
3. **Events (`/admin/events`)**: Create, update, feature, and archive branch workshops, hackathons, summits, and technical talks.
4. **Team Access (`/admin/team`)**: Manage the executive whitelist (`admin_whitelist`) to grant or revoke administrative privileges.
5. **Settings (`/admin/settings`)**: Configure membership drive status, base membership fees, UPI payment details, and branch treasurer credentials.

---

## 🔑 Accessing the Admin Portal

1. Navigate to: **`https://<your-domain>/admin/login`** (or click the **[Admin]** link in the site footer).
2. Enter your authorized administrator email and password.
   - *For local testing & offline development*, click **"Demo Login"** or use `admin@bmsce.ac.in` / `adminpassword`.
   - *In live mode*, authentication requires an account in Supabase Auth matching an entry in `admin_whitelist`.
3. Upon authentication, you will be redirected to the **Verification Dashboard** (`/admin/orders`).
4. To sign out, click the **"Sign Out"** button in the top navigation bar.

---

## 📋 Verifying Membership Applications (`/admin/orders`)

The `/admin/orders` dashboard serves as the central financial ledger and review station during the membership drive.

### 1. Key Performance Indicators (KPIs)
At the top of the dashboard, real-time counters display:
- **Total Orders**: Cumulative count of all submitted orders.
- **Pending Review**: Orders awaiting executive inspection.
- **Verified Members**: Approved members with valid dues payment.
- **Funds Collected**: Total verified monetary amount (₹) collected for the branch.

### 2. Reviewing an Incoming Order
Each application row provides comprehensive student and payment details:
- **Student Profile**: Full Name, USN, Department, Year of Study, and Institutional Email.
- **Selected Chapters**: The list of technical societies the student opted into (CS, PES, PELS/IES, RAS, WIE, SSIT).
- **Merchandise Size**: The selected T-Shirt size (`S`, `M`, `L`, `XL`, `XXL`).
- **Total Amount Due**: Base membership fee plus society add-ons.
- **UTR / Bank Reference**: The 12-digit transaction number provided by the applicant.
- **Order Reference & Receipt Number**: Sequential branch tracking references (`BMSCE-XXXXXX` and `BMSCE-IEEE-YYYY-XXXX`).

### 3. Inspecting Payment Proof
1. Click the blue **"View Proof"** button next to any order.
2. A full-screen modal will display the payment screenshot uploaded by the student (securely rendered via a short-lived signed URL from the private storage bucket).
3. **Verification Checklist**:
   - Payee UPI VPA matches the branch account (e.g., `bmsceieee@okhdfcbank`).
   - Payment amount matches the exact order total.
   - Bank reference / UTR on the screenshot matches the UTR entered by the student.
   - Transaction date/time corresponds to the order submission window.
   - Cross-check against the branch bank account or merchant UPI app to confirm credit.

### 4. Approving an Order (Verify)
1. Click the green **"Verify"** button.
2. The order status updates immediately to **Verified Member**.
3. *Note on Decoupled Receipt Workflow*: Verifying an order deliberately does not trigger an immediate email. This allows executives to reconcile payments in bulk or verify transactions when working offline without risking mail timeout. Once verified, the order displays a dedicated **"Send Receipt"** button.
4. The student immediately sees their status update to **Verified Member** when logging into their `/account` portal.

### 5. On-Demand Receipt Dispatch
1. For any verified order, locate the **"Send Receipt"** button.
2. Clicking it calls `/api/send-receipt`, which:
   - Compiles student information, chapters, fees, and treasurer credentials.
   - Programmatically renders a formal, branded A4 PDF receipt (`pdf-lib`) containing branch seals, details, and signatures.
   - Dispatches a transactional email to the student's registered address with the PDF attached.
3. The dashboard displays the live delivery status:
   - **Receipt Sent**: Shows an amber/green badge with the exact dispatch timestamp.
   - **Failed Delivery**: Displays the error message alongside a **"Retry"** button.

### 6. Rejecting an Order (Action Required)
If the proof is unreadable, cropped, missing the UTR, or the wrong amount:
1. Click the red **"Reject"** button.
2. In the dialog, enter clear, constructive feedback for the applicant (e.g. *"Screenshot does not display the 12-digit UTR number. Please upload the full transaction statement from your UPI app."*).
3. Click **"Confirm Rejection"**.
4. The order status changes to **Action Required (Rejected)**.
5. The student receives your specific feedback on their `/account` portal with an active **"Resubmit Clear Payment Proof"** button. They can re-upload a clear screenshot and correct their UTR without creating a duplicate order.

### 7. Manual Receipt Generator (Offline / Cash Payments)
For students who paid dues via direct bank transfer, cash, or campus desk:
1. Click the **"Issue Manual Receipt"** button at the top of `/admin/orders`.
2. Fill in the modal fields:
   - Student Full Name, Institutional Email, and USN.
   - Amount Received (₹).
   - Chapters Included.
   - Issuing Reason / Note (e.g. *"Offline desk cash payment at Quadrangle"*).
3. Click **"Generate & Dispatch Receipt"**.
4. The system allocates an official sequential receipt number (`BMSCE-IEEE-YYYY-XXXX`), logs the action in `issued_receipts` and `admin_audit_log`, and dispatches the PDF receipt to the student.

### 8. Exporting the Membership Ledger (CSV)
1. At the top right of `/admin/orders`, click **"Export CSV"**.
2. A sanitized CSV file (`bmsce_ieee_orders_YYYY-MM-DD.csv`) will download automatically.
3. All fields are sanitized to protect against spreadsheet formula injection. Open in Excel, Google Sheets, or Numbers to analyze departmental sign-ups or prepare official rosters for IEEE Region 10 and Bangalore Section.

---

## 📢 Sitewide Announcement Banner (`/admin/announcement`)

1. Click **"Announcement"** in the admin header or navigate to `/admin/announcement`.
2. **Toggle Status**:
   - `ENABLED`: The banner appears across the top of all public pages.
   - `DISABLED`: The banner is hidden.
3. **Banner Message Text**: Enter clear announcement copy (e.g. *"Membership Drive 2026 is live. Early-bird IEEE Computer Society benefits expire this Friday!"*).
4. **Call-to-Action Link URL** (Optional): Provide an internal path (e.g. `/membership`) or an external URL. Unsafe `javascript:` protocols are strictly blocked.
5. Review the real-time preview box, then click **"Save & Publish Banner"**. The live website reflects changes immediately.

---

## 🗓️ Events & Workshops Manager (`/admin/events`)

The `/admin/events` page allows the executive committee to keep the campus community informed without modifying code:

1. **Viewing Events**: See all currently configured branch events, categorized by type (*workshop*, *hackathon*, *summit*, *talk*) with chapter affiliation, date, and venue.
2. **Creating an Event**:
   - Click **"Add Event"**.
   - Provide an alphanumeric Slug / Event ID (e.g., `xtreme-2026`).
   - Fill in Title, Category, Chapter, Date (`YYYY-MM-DD`), Time, and Campus Venue.
   - Provide a cover image URL (Unsplash or hosted asset).
   - Add a detailed Event Description.
   - Set an External Registration URL (e.g., Google Form, Devfolio, or Unstop).
   - Check **Featured Event** if the event should be highlighted on the landing page hero carousel.
3. **Editing an Event**: Click **"Edit"** on any existing event card, update details in the modal, and save.
4. **Deleting an Event**: Click **"Delete"** and confirm. The event is immediately unlisted from both the homepage and corresponding `/chapters/[slug]` pages.

---

## 👥 Executive Team Access & Whitelist (`/admin/team`)

Branch executive privileges are controlled through the `admin_whitelist` table, ensuring secure role-based administration:

1. **Viewing Access**: See all active administrators and pre-authorized whitelist entries.
2. **Granting Access**:
   - In the "Add Executive" section, enter the member's institutional email (e.g., `chair.ieee@bmsce.ac.in`).
   - Select their designated administrative role (`admin` or `chair`).
   - Click **"Grant Whitelist Access"**.
   - When the executive signs up or logs into `/admin/login`, their account is automatically provisioned with admin permissions via a database trigger.
3. **Revoking Access**:
   - Click **"Revoke"** next to any whitelisted email.
   - *Security Note*: Revoking an executive removes their administrative privileges immediately without deleting historical order records. Orders verified by that administrator will retain their verified audit trail (`orders_verified_by_auth_user_fkey`).

---

## ⚙️ Drive & Branch Settings (`/admin/settings`)

The `/admin/settings` module controls the core business parameters of the branch:

1. **Membership Drive Status**:
   - **Active (Open)**: The public membership registration flow is accessible.
   - **Inactive (Closed)**: The flow is closed with an informational notice.
2. **Financial Configuration**:
   - **Base Membership Fee (₹)**: The mandatory base fee applied to every order (e.g., `1810`).
   - **Payee UPI VPA (ID)**: The branch UPI Virtual Payment Address (e.g., `bmsceieee@okhdfcbank`) encoded into client QR codes.
   - **Payee Account Name**: The official merchant or account name displayed in UPI apps (e.g., `BMSCE IEEE Student Branch`).
3. **Branch Treasurer Credentials (Printed on Receipts)**:
   - **Treasurer Name**: Full name of the branch treasurer (e.g., `Neha Ramiah`).
   - **Treasurer Role / Title**: Designation (e.g., `Treasurer and MDC`).
   - **Treasurer Phone / WhatsApp**: Official contact number for billing disputes (e.g., `+91 6385525264`).
   - **Signature URL**: Path or URL to the authorized digital signature stamp rendered onto generated PDF receipts.
4. Click **"Save Settings"** to persist configuration across all server APIs.

---

## 🔒 Security Best Practices for Executives

1. **Never edit admin roles manually in raw database tables**: Always manage access through `/admin/team` to ensure proper trigger synchronization with `admin_whitelist`.
2. **Keep the Service Role Key confidential**: The `SUPABASE_SERVICE_ROLE_KEY` is a server-only credential that bypasses Row-Level Security. Never expose it in client code, commit it to GitHub, or share it in chat channels.
3. **Audit Trails**: All status modifications, settings updates, manual receipt issuances, and team access modifications are permanently logged in `admin_audit_log` with actor ID, email, timestamp, and payload.
4. **Shared Campus Devices**: Always click **"Sign Out"** when accessing the admin portal on shared college lab workstations.
