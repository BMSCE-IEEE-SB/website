import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Dashboard · IEEEXtreme 20.0',
  description: 'View your IEEEXtreme 20.0 squad details, assigned faculty proctor, and official IEEE vTools registration status.',
};

export default function XtremeTeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[85vh]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-orange/15 via-brand-sky/5 to-transparent"
      />
      <div className="container-page relative py-8 sm:py-12">{children}</div>
    </div>
  );
}

