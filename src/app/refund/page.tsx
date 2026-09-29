import type { Metadata } from 'next';
import LegalShell from '@/components/site/LegalShell';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Policy regarding dues, payment reversals, and cancellations for BMSCE IEEE membership.',
};

export default function RefundPolicyPage() {
  return (
    <LegalShell title="Refund &amp; cancellation policy" subtitle="BMSCE IEEE Student Branch (Region 10)">
        <p className="rounded-2xl bg-sky-50 px-5 py-4 text-sm text-sky-900">Please review this policy before making UPI payments. All dues collected directly support student branch operations, technical symposiums, and global IEEE chapter enrollments.</p>

        <section>
          <h2>1. Non-Refundable Post-Verification</h2>
          <p>
            Once a membership registration is reviewed, validated, and marked as <strong className="text-emerald-700">Verified</strong> by the branch executive team, dues become <strong>non-refundable</strong>.
          </p>
        </section>

        <section>
          <h2>2. Duplicate or Erroneous Transactions</h2>
          <p>
            If a student is charged multiple times due to a UPI network timeout, banking glitch, or accidental double submission:
          </p>
          <ul>
            <li>The student must reach out to the Treasurer within <strong>5 calendar days</strong> of the transaction.</li>
            <li>Requests must include the bank statement showing both debits, the order reference number, and corresponding UTRs.</li>
            <li>Verified duplicate charges will be refunded directly to the originating bank account within <strong>5–7 working days</strong> after reconciliation.</li>
          </ul>
        </section>

        <section>
          <h2>3. Rejected Applications</h2>
          <p>
            If an application is marked as <strong className="text-red-700">Rejected</strong> (e.g. illegible screenshot, unverified UTR, or incomplete transfer):
          </p>
          <ul>
            <li>The student is granted opportunity to <strong>Resubmit Payment Proof</strong> via their member dashboard without incurring any new fee.</li>
            <li>If the student chooses not to continue and the bank confirms funds were received, a full reversal may be authorized upon written request prior to roster submission.</li>
          </ul>
        </section>

        <section>
          <h2>4. Contact Information</h2>
          <p>
            For all payment inquiries, transaction reconciliation, or reversal disputes, contact:
          </p>
          <div className="mt-3 space-y-1 rounded-2xl bg-paper p-5 text-sm">
            <p className="font-semibold text-ink">Neha Ramiah</p>
            <p className="text-ink-soft">Treasurer &amp; Membership Development Chair</p>
            <p>BMSCE IEEE Student Branch</p>
            <p>Phone: <a href="tel:+916385525264" className="font-medium text-brand-navy hover:underline">+91 6385525264</a></p>
          </div>
        </section>
    </LegalShell>
  );
}
