import { cn } from '@/lib/utils';

/** The three dots from the BMSCE IEEE emblem: orange, navy, sky. */
export function BrandDots({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex items-center gap-1', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
      <span className="h-1.5 w-1.5 rounded-full bg-brand-navy" />
      <span className="h-1.5 w-1.5 rounded-full bg-brand-sky" />
    </span>
  );
}

export function SectionLabel({ index, children, light }: { index: string; children: React.ReactNode; light?: boolean }) {
  return (
    <p className={cn('inline-flex items-center gap-3 text-xs font-semibold tracking-[0.16em] uppercase', light ? 'text-white/70' : 'text-ink-soft')}>
      <span className={cn('font-mono tracking-normal', light ? 'text-brand-orange' : 'text-brand-orange')}>{index}</span>
      <span className={cn('h-px w-8', light ? 'bg-white/30' : 'bg-ink/20')} />
      {children}
    </p>
  );
}

/** Geometric motif taken from the emblem's three sails. */
export function Sails({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <path d="M92 18 L40 150 L96 118 Z" fill="#f26625" />
      <path d="M104 14 L168 150 L112 108 Z" fill="#00377e" />
      <path d="M36 164 L172 164 L120 118 Q80 150 36 164 Z" fill="#18a4fe" />
      <circle cx="28" cy="96" r="14" fill="#f26625" />
      <circle cx="176" cy="92" r="14" fill="#00377e" />
      <circle cx="104" cy="186" r="12" fill="#18a4fe" />
    </svg>
  );
}
