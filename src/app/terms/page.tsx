import type { Metadata } from 'next';
import LegalShell from '@/components/site/LegalShell';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions governing student membership and branch participation at BMSCE IEEE.',
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of membership" subtitle="BMSCE IEEE Student Branch (Branch 06261, Region 10)">
        <section>
          <h2>1. Eligibility & Registration</h2>
          <p>
            Membership in the BMSCE IEEE Student Branch is open to currently enrolled undergraduate, postgraduate, and research scholars of B.M.S. College of Engineering, Bengaluru. Applicants must provide accurate institutional identification (USN and college email).
          </p>
        </section>

        <section>
          <h2>2. Payment & Membership Activation</h2>
          <p>
            Dues consist of a fixed Base Branch Membership plus variable fees for elected technical societies (Computer Society, Power & Energy Society and Sensors Council (PES & SC), Power Electronics Society and the Industrial Electronics Society (PELS & IES), Women in Engineering, Society on Social Implications of Technology).
          </p>
          <ul>
            <li>Payments must be executed to the official branch UPI VPA as presented during checkout.</li>
            <li>Uploading a fraudulent, doctored, or non-matching transaction screenshot constitutes a disciplinary breach and results in immediate application revocation.</li>
            <li>Applications remain in <strong className="text-amber-700">Pending Verification</strong> status until bank reconciliation by the Executive Committee Treasurer or Chair.</li>
          </ul>
        </section>

        <section>
          <h2>3. IEEE Code of Ethics</h2>
          <p>
            All registered members pledge to uphold the highest ethical standards of the Institute of Electrical and Electronics Engineers (IEEE), including maintaining academic integrity, treating peers with respect, and fostering an inclusive engineering environment free from harassment.
          </p>
        </section>

        <section>
          <h2>4. IEEE.org Accounts & Duration</h2>
          <p>
            Local registration grants immediate access to branch activities, hackathons, and internal project mentorship. Official global credentials for IEEE.org and IEEE Xplore are provisioned separately in batches by the branch executive team and are valid for the active academic calendar year.
          </p>
        </section>

        <section>
          <h2>5. Amendments</h2>
          <p>
            The Executive Committee reserves the right to amend membership guidelines and event schedules in accordance with BMSCE institutional directives and IEEE Region 10 protocols.
          </p>
        </section>
    </LegalShell>
  );
}
