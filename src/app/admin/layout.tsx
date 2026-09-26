import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Executive admin', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[70vh] bg-paper">{children}</div>;
}
