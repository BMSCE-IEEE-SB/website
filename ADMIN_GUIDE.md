# BMSCE IEEE Admin Guide

For executive committee members, the treasurer and volunteers who verify payments and run the membership drive.

---

## Signing in

1. Go to `/admin/login` (there is an **Executive login** link in the site footer).
2. Sign in with your admin email and password. Your account must be listed in the `admins` table in Supabase.
3. You land on the **Overview**. If you opened a specific admin link before signing in, you are taken back to it.

In demo mode (no Supabase connected), any login works and the portal shows sample data, marked with a "Demo mode" badge.

---

## Overview (`/admin`)

A snapshot of the drive:

- **Verified funds** and how much is still waiting to be verified.
- **Pending review**, and how long the oldest application has been waiting.
- **Verified members**, with a trend line of verifications over the last 14 days.
- **Applications this week** compared with last week.
- **Needs attention**: applications with warnings first, then the oldest pending ones. Click one to open it.
- Charts for applications per day, application status, chapter sign-ups, departments and year of study. Every chart has a **Table** button to see the exact numbers.
- **Recent activity** from the whole admin team.

---

## Verifying payments (`/admin/orders`)

### Finding applications
- Tabs switch between **Pending**, **Verified**, **Rejected** and **All**.
- Search by name, USN, order reference, UTR or phone.
- Filter by chapter, department and date, and sort by newest, oldest or amount.
- **Needs a closer look** shows only applications with warnings.

### Warnings the portal checks for you
| Warning | What it means |
|---|---|
| Duplicate UTR | The same UTR number appears on more than one application. One of them is probably re-using a screenshot. |
| Amount check | What the student paid does not equal the base fee plus their chapters. |
| Repeat student | The same USN has more than one active application. |

### Reviewing one application
Click a row to open the side panel. It shows the payment screenshot (click to zoom), the UTR with a copy button, the student's details, a timeline and any warnings.

Before verifying, check in your bank or UPI app that:
- the UTR exists and was paid to the branch UPI ID,
- the amount matches the application total,
- the date is on or after the application was submitted.

Then:
- **Verify payment** marks the student as a member and emails them a receipt (if email is set up). If the application has a warning, you are asked to confirm first.
- **Reject** asks for a reason. Pick one of the common reasons or write your own. The student sees it in their portal and can upload a new screenshot without paying again.
- **Private note** is for the admin team only, for example "Bank shows payment on 12 Oct, waiting for statement".
- Use the arrows at the top of the panel to move to the previous or next application.

### Working through many at once
- Tick the boxes (or press `x`) to select several applications, then use the bar at the bottom to **Verify**, **Reject** or **Export** them together.
- **Export** downloads the current filtered list as a spreadsheet.

### Keyboard shortcuts
| Key | Action |
|---|---|
| `j` / `k` | Move down / up |
| `Enter` | Open the highlighted application |
| `v` | Verify |
| `r` | Reject |
| `x` | Select |
| `/` | Search |
| `Esc` | Close the panel |
| `?` | Show all shortcuts |

---

## Members (`/admin/members`)

Everyone whose payment has been verified.

- The chapter tiles at the top show how many members each chapter has. Click one to filter.
- **Credentials pending / sent** tracks who has received their IEEE.org login. Click a member's badge to mark it, or select several and use **Credentials sent**.
- Type a member's **IEEE member ID** straight into the table. It saves when you click away.
- **Export roster** downloads the list (or one chapter's list) for IEEE headquarters or chapter leads.
- **Email** opens your email app with the filtered members in BCC.

---

## Fees & payment (`/admin/settings`)

Change the base membership fee, each chapter's price, the branch UPI ID and the payee name.

1. Edit the values. The fee slip on the right shows what students will see.
2. Scan the test QR code with your phone to confirm it opens the right payee and amount. Do not complete the payment.
3. Click **Save**, check the list of changes, and confirm.

New registrations use the new values straight away. Applications already submitted keep the amount the student paid.

---

## Announcement (`/admin/announcement`)

Edit the banner shown at the top of every public page, switch it on or off, and add an optional link (a page on this site, like `/membership`, or a full `https://` address).

---

## Activity log (`/admin/activity`)

Every verification, rejection, note, IEEE ID change, credentials update, settings change and announcement edit is recorded with who did it and when. Filter it, search it, or export it.

---

## Good practice

- Verify against the bank statement, not just the screenshot.
- Never verify an application with a **Duplicate UTR** warning without checking both applications.
- Write rejection reasons the student can act on.
- Sign out on shared computers.
