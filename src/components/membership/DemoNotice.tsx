import type { ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';

/** Shown only in demo mode (no Supabase connected). */
export default function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}
