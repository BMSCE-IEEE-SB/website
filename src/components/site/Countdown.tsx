'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Live countdown. Renders placeholders on the server to avoid hydration mismatches. */
export default function Countdown({ to, className, compact, light }: { to: number; className?: string; compact?: boolean; light?: boolean }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const p = now === null ? null : parts(to - now);
  const cells: [string, number | undefined][] = [
    ['days', p?.d],
    ['hrs', p?.h],
    ['min', p?.m],
    ['sec', p?.s],
  ];

  if (p && to - (now ?? 0) <= 0) {
    return <span className={cn('text-sm font-semibold', light ? 'text-white' : 'text-brand-orange', className)}>Happening now</span>;
  }

  return (
    <div className={cn('flex gap-1.5', className)} role="timer" aria-live="off">
      {cells.map(([label, v]) => (
        <div key={label} className={cn('text-center', compact ? 'min-w-9' : 'min-w-12')}>
          <div
            className={cn(
              'rounded-lg font-mono font-medium tabular-nums',
              compact ? 'px-1.5 py-1 text-sm' : 'px-2 py-1.5 text-xl sm:text-2xl',
              light ? 'bg-white/12 text-white' : 'bg-ink text-white',
            )}
          >
            {v === undefined ? '--' : String(v).padStart(2, '0')}
          </div>
          <div className={cn('mt-1 text-[10px] tracking-wider uppercase', light ? 'text-white/60' : 'text-muted')}>{label}</div>
        </div>
      ))}
    </div>
  );
}
