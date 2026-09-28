import type { Metadata } from 'next';
import LegalShell from '@/components/site/LegalShell';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy and data protection guidelines for BMSCE IEEE Student Branch members and applicants.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy policy" subtitle="Last updated September 2026 · BMSCE IEEE Student Branch">
        <section>
          <h2>1. Information We Collect</h2>
          <p>
            When registering for membership or participating in technical chapters at B.M.S. College of Engineering IEEE Student Branch, we collect the following academic and personal information:
          </p>
          <ul>
            <li><strong>Contact details:</strong> Full Name, Institutional Email Address, and Phone Number.</li>
            <li><strong>Academic identifiers:</strong> University Seat Number (USN), Engineering Department, and Year of Study.</li>
            <li><strong>IEEE Information:</strong> Existing IEEE Membership Number (if renewing or transferring).</li>
            <li><strong>Payment Verification:</strong> UPI transaction screenshots and UTR transaction reference numbers uploaded for reconciliation.</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Data</h2>
          <p>The information submitted is exclusively used to:</p>
          <ul>
            <li>Validate enrollment at B.M.S. College of Engineering.</li>
            <li>Reconcile UPI membership dues against bank account statements.</li>
            <li>Provision student memberships into selected technical chapters (CS, PES & SC, PELS & IES, WIE, SSIT).</li>
            <li>Transmit roster credentials to IEEE Headquarters (IEEE.org) for official member onboarding.</li>
            <li>Dispatch automated confirmation receipts and branch communications.</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Storage & Security</h2>
          <p>
            All member profiles and uploaded proof documents are securely stored within encrypted database storage (Supabase). Payment verification screenshots are restricted to authorized Executive Committee administrators and are not indexed publicly or shared with commercial third parties.
          </p>
        </section>

        <section>
          <h2>4. Third-Party Disclosures</h2>
          <p>
            We do not sell, rent, or monetize student personal data. Data is shared strictly with the official IEEE organization (IEEE Region 10 / Bangalore Section) solely for issuing global memberships, access to IEEE Xplore, and credential issuance.
          </p>
        </section>

        <section>
          <h2>5. Contact & Data Rectification</h2>
          <p>
            Members may request data corrections, update contact numbers, or inquire about their record by emailing the branch executive team at <span className="font-medium text-brand-navy">ieee.sb@bmsce.ac.in</span> or visiting the IEEE Student Branch room on the BMSCE campus.
          </p>
        </section>
    </LegalShell>
  );
}
