'use client';
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { BookOpen, Trophy, Users, Wrench } from 'lucide-react';
import { BRANCH, pillars } from '@/data/site';
import Reveal from '@/components/site/Reveal';
import CountUp from '@/components/site/CountUp';
import { SectionLabel } from '@/components/site/BrandShapes';
import { cn } from '@/lib/utils';

const local = (name: string) => `/${name}`;
const PILLAR_MS = 5000;
const pillarIcons = [BookOpen, Wrench, Trophy, Users];

export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-30, 50]);
  const stripRef = useRef<HTMLDivElement>(null);
  const stripInView = useInView(stripRef, { margin: '-15% 0px' });
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(0);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    if (interacted || !stripInView || reduce) return;
    const id = setInterval(() => setOpen((v) => (v + 1) % pillars.length), PILLAR_MS);
    return () => clearInterval(id);
  }, [interacted, stripInView, reduce]);

  const pick = (i: number) => {
    setOpen(i);
    setInteracted(true);
  };

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
                We are Branch {BRANCH.branchCode} of {BRANCH.region}, part of the {BRANCH.section}. Membership is the campus door into IEEE — labs, chapters, and the people already running them here.
              </p>
            </Reveal>
          </div>

          <div className="relative hidden h-[420px] lg:col-span-5 lg:block">
            <motion.img style={{ y: y1 }} src={pillars[0].image} alt="Workshop in session on campus" className="absolute top-0 right-0 h-64 w-72 rounded-[28px] object-cover shadow-xl" />
            <motion.img style={{ y: y2 }} src={local('gallery_img_33_102.png')} alt="Students collaborating at a hackathon" className="absolute bottom-0 left-4 h-56 w-60 rounded-[28px] object-cover shadow-xl ring-8 ring-paper" />
            <motion.div style={{ y: y2 }} className="absolute top-8 left-10 rounded-2xl bg-white px-4 py-3 shadow-lg">
              <p className="display text-2xl text-brand-orange">
                <CountUp value="400,000+" />
              </p>
              <p className="text-xs text-muted">IEEE members worldwide</p>
            </motion.div>
          </div>
        </div>

        {/* Pillars: expanding photo strip on desktop, stacked on mobile. Cycles until the visitor picks one. */}
        <div ref={stripRef} className="mt-20 flex flex-col gap-3 lg:h-[380px] lg:flex-row">
          {pillars.map((p, i) => {
            const isOpen = open === i;
            const Icon = pillarIcons[i];
            return (
              <button
                key={p.title}
                type="button"
                onMouseEnter={() => pick(i)}
                onFocus={() => pick(i)}
                onClick={() => pick(i)}
                aria-expanded={isOpen}
                className={cn(
                  'group relative overflow-hidden rounded-[28px] text-left text-white transition-[flex-grow,min-height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:min-h-0 lg:flex-1',
                  isOpen ? 'min-h-[300px] lg:flex-[2.6]' : 'min-h-[150px]',
                )}
              >
                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  className={cn('absolute inset-0 h-full w-full object-cover transition-all duration-700', isOpen ? 'scale-100 grayscale-0' : 'scale-110 grayscale group-hover:scale-105')}
                />
                <div className={cn('absolute inset-0 transition-opacity duration-700', isOpen ? 'opacity-0' : 'opacity-100')} style={{ background: 'rgb(11 27 51 / 0.55)' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
                <div className={cn('absolute inset-x-0 bottom-0 h-1 origin-left transition-transform duration-700', isOpen ? 'scale-x-100' : 'scale-x-0')} style={{ background: p.accent }} />
                {isOpen && !interacted && !reduce && (
                  <motion.div key={`bar-${open}`} className="absolute inset-x-0 bottom-0 h-1 origin-left bg-white/70" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: PILLAR_MS / 1000, ease: 'linear' }} />
                )}

                <div className="relative flex h-full flex-col justify-between gap-6 p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur transition-colors duration-500" style={{ background: isOpen ? p.accent : 'rgb(255 255 255 / 0.12)' }}>
                        <Icon className={cn('h-5 w-5', isOpen && p.accent === '#fbbf24' ? 'text-ink' : 'text-white')} />
                      </span>
                      <span className="font-mono text-sm text-white/60">0{i + 1}</span>
                    </span>
                    {!isOpen && (
                      <span className="rounded-full bg-white/12 px-2.5 py-1 font-display text-sm font-bold backdrop-blur" style={{ color: p.accent }}>
                        {p.stat}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className={cn('display transition-all duration-500', isOpen ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl lg:text-[1.75rem] xl:text-[2rem]')}>{p.title}</h3>
                    {!isOpen && <p className="mt-1.5 text-sm text-white/65">{p.statLabel}</p>}
                    <div className={cn('grid transition-[grid-template-rows,opacity] duration-500', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                      <div className="overflow-hidden">
                        <p className="mt-3 max-w-md text-white/85">{p.text}</p>
                        <p className="mt-4 flex items-baseline gap-2">
                          <span className="display text-4xl" style={{ color: p.accent }}>{p.stat}</span>
                          <span className="text-sm text-white/70">{p.statLabel}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
