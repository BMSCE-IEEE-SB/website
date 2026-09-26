'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { testimonials } from '@/data/site';
import { Sails } from '@/components/site/BrandShapes';
import NetworkCanvas from '@/components/site/NetworkCanvas';

function RotatingQuote() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % testimonials.length), 6000);
    return () => clearInterval(id);
  }, [reduce]);
  const t = testimonials[i];
  return (
    <div className="min-h-[150px]">
      <AnimatePresence mode="wait">
        <motion.figure key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}>
          <blockquote className="text-lg leading-relaxed text-white/90">&ldquo;{t.quote}&rdquo;</blockquote>
          <figcaption className="mt-4 text-sm text-white/55">
            {t.name} · {t.role}
          </figcaption>
        </motion.figure>
      </AnimatePresence>
    </div>
  );
}

/** Split layout for sign-in / sign-up: brand panel on the left, form on the right. */
export default function AuthShell({ title, children, top }: { title: React.ReactNode; children: React.ReactNode; top?: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_-40px_rgb(11_27_51/0.45)] lg:grid-cols-[1.05fr_1fr]">
      <aside className="grain relative hidden flex-col justify-between gap-10 overflow-hidden bg-night p-10 text-white lg:flex xl:p-12">
        <NetworkCanvas className="absolute inset-0 h-full w-full opacity-40" density={0.00006} />
        <Sails className="absolute -right-16 -bottom-16 h-72 w-72 animate-spin-slow opacity-10" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-orange uppercase">BMSCE IEEE · Branch 06261</p>
          <h2 className="display mt-5 text-5xl leading-[0.95]">{title}</h2>
        </div>
        <div className="relative space-y-10">
          {top}
          <RotatingQuote />
        </div>
      </aside>
      <div className="p-6 sm:p-10 xl:p-12">{children}</div>
    </div>
  );
}
