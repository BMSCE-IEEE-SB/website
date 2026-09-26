'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { path: '/membership/register', label: 'Account' },
  { path: '/membership/profile', label: 'Details' },
  { path: '/membership/chapters', label: 'Chapters' },
  { path: '/membership/checkout', label: 'Payment' },
];

export default function Stepper() {
  const pathname = usePathname();
  const current = Math.max(0, steps.findIndex((s) => pathname?.startsWith(s.path)));

  return (
    <nav aria-label="Registration progress" className="mx-auto w-full max-w-xl">
      <p className="mb-3 text-center text-xs font-medium text-muted sm:hidden">
        Step {current + 1} of {steps.length}: <span className="text-ink">{steps[current].label}</span>
      </p>
      <ol className="flex items-center">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.path} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')} aria-current={active ? 'step' : undefined}>
              <span className="flex items-center gap-2.5">
                <motion.span
                  initial={false}
                  animate={{ scale: active ? 1.08 : 1 }}
                  className={cn(
                    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300',
                    done && 'bg-brand-navy text-white',
                    active && 'bg-brand-orange text-white',
                    !done && !active && 'bg-white text-muted ring-1 ring-line',
                  )}
                >
                  {active && <span className="absolute inset-0 animate-ping rounded-full bg-brand-orange/30" />}
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </motion.span>
                <span className={cn('hidden text-sm font-medium sm:block', active ? 'text-ink' : 'text-muted')}>{s.label}</span>
              </span>
              {i < steps.length - 1 && (
                <span className="relative mx-3 h-[3px] flex-1 overflow-hidden rounded-full bg-line">
                  <motion.span initial={false} animate={{ scaleX: done ? 1 : 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 origin-left bg-brand-navy" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
