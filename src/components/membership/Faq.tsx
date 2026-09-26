'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { faqs } from '@/data/site';
import { cn } from '@/lib/utils';

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="divide-y divide-line border-y border-line">
      {faqs.map((f, i) => {
        const on = open === i;
        return (
          <li key={f.q}>
            <button type="button" onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-6 py-6 text-left">
              <span className="text-lg font-semibold text-ink sm:text-xl">{f.q}</span>
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300', on ? 'rotate-45 bg-brand-orange text-white' : 'bg-white text-ink')}>
                <Plus className="h-4 w-4" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                  <p className="max-w-2xl pb-6 text-ink-soft">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
