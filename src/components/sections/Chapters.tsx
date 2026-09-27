'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { chapters } from '@/data/site';
import Reveal from '@/components/site/Reveal';
import { SectionLabel } from '@/components/site/BrandShapes';
import { cn } from '@/lib/utils';

const AUTO_MS = 6000;

export default function Chapters() {
  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-20% 0px' });
  const reduce = useReducedMotion();
  const ch = chapters[active];
  const Icon = ch.icon;

  // Gently cycles through chapters until the visitor picks one.
  useEffect(() => {
    if (interacted || !inView || reduce) return;
    const id = setInterval(() => setActive((v) => (v + 1) % chapters.length), AUTO_MS);
    return () => clearInterval(id);
  }, [interacted, inView, reduce]);

  const pick = (i: number) => {
    setActive(i);
    setInteracted(true);
  };

  return (
    <section id="chapters" className="relative bg-white py-24 sm:py-32">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Reveal>
              <SectionLabel index="02">Chapters & affinity groups</SectionLabel>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="section-title mt-6 max-w-3xl">Find your interest</h2>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <p className="lead max-w-md">Five communities, each with its own projects and mentors. Pick one or join them all when you register.</p>
          </Reveal>
        </div>

        {/* Desktop explorer */}
        <div ref={ref} className="mt-16 hidden gap-10 lg:grid lg:grid-cols-12">
          <ol className="lg:col-span-5">
            {chapters.map((c, i) => {
              const on = i === active;
              return (
                <li key={c.slug} className="border-b border-line first:border-t">
                  <button
                    type="button"
                    onMouseEnter={() => pick(i)}
                    onFocus={() => pick(i)}
                    onClick={() => pick(i)}
                    aria-pressed={on}
                    className="group flex w-full items-center gap-3.5 py-3.5 text-left"
                  >
                    {c.logo && (
                      <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-ink/10">
                        <Image src={c.logo} alt="" aria-hidden width={100} height={60} className="max-h-8 w-full object-contain" />
                      </span>
                    )}
                    <span className={cn('flex-1 text-sm leading-snug font-semibold transition-colors sm:text-base', on ? 'text-ink' : 'text-ink/60 group-hover:text-ink')} style={on ? { color: c.color } : undefined}>{c.name}</span>
                    <span className="relative h-8 w-8 shrink-0">
                      {on && !interacted && !reduce && (
                        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                          <motion.circle key={active} cx="18" cy="18" r="15" fill="none" stroke={c.color} strokeWidth="2.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: AUTO_MS / 1000, ease: 'linear' }} />
                        </svg>
                      )}
                      <span className={cn('absolute inset-1.5 rounded-full transition-all', on ? 'scale-100' : 'scale-50 opacity-0')} style={{ background: c.color }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="relative min-h-[540px] lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.article
                key={ch.slug}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="grain absolute inset-0 flex flex-col overflow-hidden rounded-[32px] text-white"
                style={{ background: ch.color }}
              >
                <div className="relative h-[46%] overflow-hidden">
                  <motion.img initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} src={ch.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${ch.color}, transparent 70%)` }} />
                </div>
                <div className="relative flex flex-1 flex-col justify-between p-8 pt-2">
                  <div>
                    <div className="flex items-center gap-3">
                      {ch.logo ? (
                        <span className="flex h-14 w-28 shrink-0 items-center justify-center rounded-xl bg-white px-2 py-1">
                          <Image src={ch.logo} alt={`${ch.name} logo`} width={160} height={80} className="max-h-12 w-full object-contain" />
                        </span>
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                          <Icon className="h-5 w-5" />
                        </span>
                      )}
                      <span className="text-sm font-semibold text-white/80">{ch.fullName}</span>
                    </div>
                    <h3 className="display mt-4 text-3xl xl:text-4xl">{ch.tagline}</h3>
                    <p className="mt-3 max-w-lg text-white/80">{ch.description}</p>
                  </div>
                  <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
                    <dl className="flex gap-8">
                      <div>
                        <dd className="display text-3xl">{ch.stats.members}</dd>
                        <dt className="text-xs text-white/70">members</dt>
                      </div>
                    </dl>
                    <Link href={`/chapters/${ch.slug}`} className="btn btn-light btn-lg">
                      Explore chapter <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: swipeable cards */}
        <div className="no-scrollbar -mx-4 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:hidden">
          {chapters.map((c) => {
            const CIcon = c.icon;
            return (
              <Link key={c.slug} href={`/chapters/${c.slug}`} className="relative flex w-[82%] shrink-0 snap-center flex-col overflow-hidden rounded-[28px] text-white sm:w-[46%]" style={{ background: c.color }}>
                <div className="relative h-40">
                  <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${c.color}, transparent 75%)` }} />
                </div>
                <div className="flex flex-1 flex-col p-6 pt-1">
                  {c.logo ? (
                    <span className="flex h-12 w-24 items-center justify-center rounded-lg bg-white px-2 py-1">
                      <Image src={c.logo} alt={`${c.name} logo`} width={120} height={60} className="max-h-10 w-full object-contain" />
                    </span>
                  ) : <CIcon className="h-6 w-6 opacity-80" />}
                  <h3 className="display mt-3 text-2xl">{c.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-white/80">{c.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                    Explore chapter <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
