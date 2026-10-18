import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Registration · IEEEXtreme 20.0',
  description: 'Register your team for IEEEXtreme 20.0 — BMSCE Student Branch Gateway',
};

export default function XtremeRegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[85vh]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-sky/15 via-brand-orange/5 to-transparent"
      />
      <div className="container-page relative py-8 sm:py-12">{children}</div>
    </div>
  );
}

