'use client';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Sails } from './BrandShapes';

export type CardData = {
  name?: string;
  usn?: string;
  department?: string;
  year?: string;
  chapters?: string[];
  status?: 'draft' | 'pending' | 'verified' | 'rejected';
  reference?: string;
};

/** Chapter colours for the chips (kept here so the card stays self-contained). */
const chipColor: Record<string, string> = {
  CS: '#0284c7',
  PES: '#059669',
  'PELS/IES': '#d97706',
  RAS: '#7c3aed',
  WIE: '#db2777',
  SSIT: '#4f46e5',
};

const statusText: Record<string, string> = {
  draft: 'Application in progress',
  pending: 'Pending verification',
  verified: 'Active member',
  rejected: 'Action required',
};

/** The digital membership card used on the landing page, during sign-up and in the portal. */
export default function MembershipCard({ data, className }: { data: CardData; className?: string }) {
  const status = data.status ?? 'draft';
  return (
    <div
      className={cn(
        'relative aspect-[1.586] w-full overflow-hidden rounded-[22px] bg-[#071a3d] p-5 text-white shadow-[0_30px_60px_-24px_rgb(6_20_46/0.7)] select-none sm:p-6',
        className,
      )}
    >
      {/* Artwork */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-brand-sky/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand-orange/30 blur-3xl" />
        <Sails className="absolute -right-8 -bottom-10 h-48 w-48 opacity-[0.16]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_14px,rgb(255_255_255/0.025)_14px_15px)]" />
      </div>

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[15px] leading-none font-extrabold tracking-tight sm:text-base" style={{ fontStretch: '115%' }}>
              <span className="text-brand-orange">BMSCE</span> IEEE
            </p>
            <p className="mt-1 text-[10px] tracking-[0.18em] text-white/55 uppercase">Student member</p>
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-semibold',
              status === 'verified' && 'bg-emerald-400/20 text-emerald-200',
              status === 'pending' && 'bg-amber-300/20 text-amber-100',
              status === 'rejected' && 'bg-red-400/20 text-red-100',
              status === 'draft' && 'bg-white/10 text-white/70',
            )}
          >
            {statusText[status]}
          </span>
        </div>

        {/* Chip */}
        <div aria-hidden className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 opacity-90 shadow-inner sm:h-8 sm:w-11" />

        <div>
          <p className="truncate font-display text-lg leading-tight font-bold sm:text-xl">{data.name || 'Your Name'}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-white/65">
            <span>{data.usn || '1BM__XX___'}</span>
            {data.department && <span>{data.department}</span>}
            {data.year && <span>{data.year === 'PG' ? 'PG' : `Year ${data.year}`}</span>}
          </div>
          <div className="mt-3 flex min-h-[22px] flex-wrap gap-1.5">
            <AnimatePresence initial={false} mode="popLayout">
              {(data.chapters?.length ? data.chapters : ['Branch']).map((c) => (
                <motion.span
                  key={c}
                  layout
                  initial={{ opacity: 0, scale: 0.4, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white ring-1 ring-white/20"
                  style={{ background: chipColor[c] ?? 'rgb(255 255 255 / 0.12)' }}
                >
                  {c}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {data.reference && <p className="absolute right-5 bottom-5 font-mono text-[10px] text-white/45 sm:right-6 sm:bottom-6">{data.reference}</p>}
    </div>
  );
}
