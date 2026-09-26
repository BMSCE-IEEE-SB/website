import Stepper from '@/components/membership/Stepper';
import { DraftProvider } from '@/components/membership/Draft';

export default function MembershipFlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <DraftProvider>
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-sky/10 to-transparent" />
        <div className="container-page relative py-10 sm:py-14">
          <Stepper />
          <div className="mt-10 sm:mt-12">{children}</div>
        </div>
      </div>
    </DraftProvider>
  );
}
