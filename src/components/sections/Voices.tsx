'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { testimonials } from '@/data/site';
import { SectionLabel, Sails } from '@/components/site/BrandShapes';

const DURATION = 7000;

export default function Voices() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const t = testimonials[i];

  useEffect(() => {
    if (paused || reduce) return;
    const id = setTimeout(() => setI((v) => (v + 1) % testimonials.length), DURATION);
    return () => clearTimeout(id);
  }, [i, paused, reduce]);

  const go = (d: number) => setI((v) => (v + d + testimonials.length) % testimonials.length);

  return (
    <section className="grain relative overflow-hidden bg-night py-24 text-white sm:py-32" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Sails className="absolute -top-24 -right-24 h-[420px] w-[420px] animate-spin-slow opacity-[0.07]" />
      <div className="container-page relative">
        <SectionLabel index="05" light>
          Member voices
        </SectionLabel>

        <div className="mt-10 min-h-[300px] sm:min-h-[260px]">
          <AnimatePresence mode="wait">
            <motion.figure key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <blockquote className="display max-w-5xl text-3xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
                <span className="text-brand-orange">&ldquo;</span>
                {t.quote}
                <span className="text-brand-orange">&rdquo;</span>
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-[11px] font-bold">{t.role.split('·')[0].trim()}</span>
                <span>
                  <span className="block font-semibold">{t.name}</span>
                  <span className="block text-sm text-white/60">{t.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        <div className="mt-12 flex items-center gap-6">
          <div className="flex flex-1 gap-2">
            {testimonials.map((_, k) => (
              <button key={k} type="button" onClick={() => setI(k)} className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/15" aria-label={`Show quote ${k + 1}`}>
                {k < i && <span className="absolute inset-0 bg-white/60" />}
                {k === i && (
                  <motion.span
                    key={`${i}-${paused}`}
                    className="absolute inset-y-0 left-0 bg-brand-orange"
                    initial={{ width: paused || reduce ? '100%' : '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: paused || reduce ? 0 : DURATION / 1000, ease: 'linear' }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-white/25 transition hover:bg-white hover:text-ink" aria-label="Previous quote">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => go(1)} className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-white/25 transition hover:bg-white hover:text-ink" aria-label="Next quote">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
