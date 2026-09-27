# BMSCE IEEE Website — Content & Asset Checklist

This checklist turns **PRD §10** into an actionable, non-technical punch list of assets, text copy, and configurations that the branch executive committee needs to supply before the membership drive and production launch.

---

## 🚨 P0: Critical for Membership Drive Launch

### 1. Payment & Banking Information
- [ ] **Branch UPI VPA (ID)**: The exact Virtual Payment Address for receiving dues (e.g. `bmsceieee@okhdfcbank` or `bmsce.ieee@sbi`).
- [ ] **Payee Display Name**: The registered merchant/account name appearing in UPI banking apps (e.g. `BMSCE IEEE Student Branch`).
- [x] **Base Membership Fee**: ₹1,810 (configured in `membership_config` and demo fallback).
- [x] **Chapter Add-on Prices** (Configured in database seed):
  - [x] IEEE Computer Society (CS): ₹100
  - [x] IEEE Power & Energy Society (PES): ₹100
  - [x] IEEE Power & Industrial Electronics Joint Chapter (PELS/IES): ₹100
  - [x] IEEE Women in Engineering (WIE): ₹50
  - [x] IEEE Social Implications of Technology (SSIT): ₹50

### 2. Branch Treasurer Credentials (Printed on Official PDF Receipts)
- [ ] **Treasurer Full Name**: Current branch treasurer (default: `Neha Ramiah`).
- [ ] **Treasurer Designation**: Official title (default: `Treasurer and MDC`).
- [ ] **Treasurer Contact Phone**: Official contact number for billing inquiries (default: `+91 6385525264`).
- [ ] **Treasurer Digital Signature**: Transparent PNG image of authorized signature for PDF receipt stamping (optional).

### 3. T-Shirt Merchandise Logistics
- [x] **Available Sizes**: `S`, `M`, `L`, `XL`, `XXL` (integrated in cart & order tracking).
- [ ] **Distribution Details**: Quadrangle collection dates and inventory counts per size.

### 4. Official Transactional Email (SMTP)
- [ ] **SMTP Sender Address**: Official institutional email (e.g. `ieee@bmsce.ac.in`).
- [ ] **SMTP App Password**: 16-character Google Workspace or Microsoft 365 app password to authorize automated receipt emails.
- [ ] **SMTP Configuration Details**:
  - `SMTP_HOST`: `smtp.gmail.com`
  - `SMTP_PORT`: `465` (SSL)
  - `SMTP_USER`: `ieee@bmsce.ac.in`
  - `SMTP_FROM`: `"BMSCE IEEE" <ieee@bmsce.ac.in>`

### 5. Executive Team Whitelist (`admin_whitelist`)
List of executive committee members who require administrative access:
- [ ] Chair: Name & institutional email (`chair.ieee@bmsce.ac.in`)
- [ ] Vice-Chair: Name & institutional email
- [ ] Secretary: Name & institutional email
- [ ] Treasurer: Name & institutional email
- [ ] Webmaster / Technical Lead: Name & institutional email

---

## 🏛️ Phase 3: Content Sections (Post-Launch)

### 1. Final About / Heritage Copy
- [ ] Official founding year, Branch Counselor quote/name.
- [ ] 2–3 paragraphs describing branch pillars, campus activities, and IEEE Region 10 history.

### 2. Executive Committee Roster
For each office bearer (Chair, Vice-Chair, Secretary, Treasurer, Webmaster, Chapter Leads):
- [ ] Full Name
- [ ] Executive Role / Designation
- [ ] High-resolution portrait photograph (square aspect ratio, transparent or clean background)
- [ ] LinkedIn profile URL

### 3. Sponsors & Partners
- [ ] High-res SVG or PNG transparent logos of past and current corporate sponsors/partners.
- [ ] Sponsor tier designations (Title Sponsor, Gold Partner, Technical Sponsor).
- [ ] Sponsor website URLs.

### 4. Alumni Showcase
For 4–8 prominent BMSCE IEEE alumni:
- [ ] Name
- [ ] Graduation Batch / Year
- [ ] Current Role and Company (e.g. Software Engineer @ Google, Hardware Engineer @ Intel)
- [ ] Photo or LinkedIn headshot

### 5. Branch Achievements & Honors
- [ ] List of awards (e.g., Outstanding Student Branch Award, Best Chapter Award).
- [ ] Notable hackathon wins, research paper publications, and dates.

### 6. Events & Workshops (Manageable via `/admin/events`)
- [ ] Upcoming event title, chapter tag, date, time, venue, and cover banner.
- [ ] External Google Form, Devfolio, or Unstop registration link.

---

## 📋 How to Submit Content
Send all copy, photos, and assets in a shared Google Drive folder or email to the branch webmaster at **ieee@bmsce.ac.in**.
