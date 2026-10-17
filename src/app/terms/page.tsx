import type { Metadata } from 'next';
import Link from 'next/link';
import LegalShell from '@/components/site/LegalShell';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms for using the BMSCE IEEE Student Branch website and membership registration services.',
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of use" subtitle="BMSCE IEEE Student Branch (Region 10)">
      <section>
        <h2>1. Website and membership information</h2>
        <p>
          This website provides information about the BMSCE IEEE Student Branch and a way to apply for
          membership. Membership applications are subject to review and confirmation by the branch.
          IEEE membership and chapter enrollment are also subject to the applicable IEEE requirements.
        </p>
      </section>

      <section>
        <h2>2. Registration and account details</h2>
        <p>
          Applicants should provide accurate information and use their own account when submitting an
          application. Keep account sign-in details private and contact the branch if account or application
          information needs correction.
        </p>
      </section>

      <section>
        <h2>3. Fees and payment</h2>
        <p>
          Applicable membership and chapter fees are shown during registration. Payment instructions,
          verification, cancellations, and refund conditions are described in the{' '}
          <Link href="/refund" className="font-medium text-brand-navy hover:underline">
            Refund &amp; cancellation policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>4. Personal information</h2>
        <p>
          Information submitted through this website is handled as described in the{' '}
          <Link href="/privacy" className="font-medium text-brand-navy hover:underline">
            Privacy policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>5. Contact</h2>
        <p>
          For questions about these terms or a membership application, contact the branch at{' '}
          <a href="mailto:ieee.sb@bmsce.ac.in" className="font-medium text-brand-navy hover:underline">
            ieee.sb@bmsce.ac.in
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}
