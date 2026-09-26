'use client';

import { usePathname } from 'next/navigation';

/** Renders children everywhere except inside the admin portal. */
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname?.startsWith('/admin') ? null : <>{children}</>;
}
