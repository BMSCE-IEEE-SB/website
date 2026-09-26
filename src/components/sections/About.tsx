'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { BRANCH, events, metrics, pillars } from '@/data/site';
import Reveal from '@/components/site/Reveal';
import CountUp from '@/components/site/CountUp';
import { SectionLabel } from '@/components/site/BrandShapes';
import { cn } from '@/lib/utils';

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-30, 50]);
  const [open, setOpen] = useState(0);

  return (
    <section id="about" className="relative overflow-hidden pt-28 pb-24 sm:pt-36 sm:pb-32">
      <div className="container-page">
        <div ref={ref} className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionLabel index="01">About the branch</SectionLabel>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="section-title mt-6">
                Since {BRANCH.established}, the place where BMSCE students go from{' '}
                <span className="relative whitespace-nowrap text-brand-navy">
                  <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-brand-sky/25 sm:h-4" />
                  curious
                </span>{' '}
                to{' '}
                <span className="relative whitespace-nowrap text-brand-orange">
                  <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-brand-orange/15 sm:h-4" />
                  capable
                </span>
                .
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="lead mt-8 max-w-2xl">
                We are Branch {BRANCH.branchCode} of {BRANCH.region}, part of the {BRANCH.section}. Membership connects you to IEEE&apos;s
                400,000+ members worldwide, and to seniors on campus who will happily spend a Saturday debugging your circuit.
              </p>
            </Reveal>
          </div>

          <div className="relative hidden h-[420px] lg:col-span-5 lg:block">
            <motion.img style={{ y: y1 }} src={events[6].image} alt="Students at an AI/ML workshop" className="absolute top-0 right-0 h-64 w-72 rounded-[28px] object-cover shadow-xl" />
            <motion.img style={{ y: y2 }} src={events[10].image} alt="Robotics challenge" className="absolute bottom-0 left-4 h-56 w-60 rounded-[28px] object-cover shadow-xl ring-8 ring-paper" />
            <motion.div style={{ y: y2 }} className="absolute top-8 left-10 rounded-2xl bg-white px-4 py-3 shadow-lg">
              <p className="display text-2xl text-brand-orange">
                <CountUp value="400,000+" />
              </p>
              <p className="text-xs text-muted">IEEE members worldwide</p>
            </motion.div>
          </div>
        </div>

        {/* Pillars: expanding strip on desktop, stacked on mobile */}
        <div className="mt-20 flex flex-col gap-3 lg:h-[340px] lg:flex-row">
          {pillars.map((p, i) => {
            const isOpen = open === i;
            return (
              <button
                key={p.title}
                type="button"
                onMouseEnter={() => setOpen(i)}
                onFocus={() => setOpen(i)}
                onClick={() => setOpen(i)}
                aria-expanded={isOpen}
                className={cn(
                  'group relative overflow-hidden rounded-[28px] p-7 text-left transition-[flex-grow,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex-1',
                  isOpen ? 'bg-ink text-white lg:flex-[2.4]' : 'bg-white text-ink hover:bg-paper-2',
                )}
              >
                <div className="flex h-full flex-col justify-between gap-8">
                  <div className="flex items-center justify-between">
                    <span className={cn('font-mono text-sm', isOpen ? 'text-brand-orange' : 'text-muted')}>0{i + 1}</span>
                    <span className={cn('h-2.5 w-2.5 rounded-full transition-colors', isOpen ? 'bg-brand-orange' : 'bg-ink/15')} />
                  </div>
                  <div>
                    <h3 className={cn('display transition-all duration-500', isOpen ? 'text-4xl sm:text-5xl' : 'text-4xl sm:text-5xl lg:text-3xl xl:text-4xl')}>{p.title}</h3>
                    <div className={cn('grid transition-[grid-template-rows,opacity] duration-500', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 lg:grid-rows-[0fr]')}>
                      <div className="overflow-hidden">
                        <p className="mt-4 max-w-md text-white/75">{p.text}</p>
                        <p className="mt-5 flex items-baseline gap-2">
                          <span className="display text-3xl text-brand-orange">{p.stat}</span>
                          <span className="text-sm text-white/60">{p.statLabel}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 80}>
              <dd className="display text-5xl text-ink sm:text-6xl">
                <CountUp value={m.value} />
              </dd>
              <dt className="mt-2 max-w-[14rem] text-sm text-muted">{m.label}</dt>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
