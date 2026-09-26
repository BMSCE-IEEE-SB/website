'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { eventStart, type SiteEvent } from '@/data/site';
import NetworkCanvas from '@/components/site/NetworkCanvas';
import Countdown from '@/components/site/Countdown';
import CountUp from '@/components/site/CountUp';
import { formatDate } from '@/lib/utils';

const WORDS = ['build', 'lead', 'compete', 'publish', 'mentor', 'belong'];

function RotatingWord() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <span className="relative inline-block">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={WORDS[i]}
          initial={{ y: '0.35em', opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-0.35em', opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block text-brand-orange"
        >
          {WORDS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function EventDeck({ upcoming }: { upcoming: SiteEvent[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const deck = upcoming.slice(0, 4);

  useEffect(() => {
    if (paused || reduce || deck.length < 2) return;
    const id = setInterval(() => setIndex((v) => (v + 1) % deck.length), 4800);
    return () => clearInterval(id);
  }, [paused, reduce, deck.length]);

  if (deck.length === 0) return null;
  const ordered = deck.map((_, k) => deck[(index + k) % deck.length]);

  return (
    <div className="relative mx-auto aspect-[4/4.6] w-full max-w-[440px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {ordered
        .map((e, depth) => ({ e, depth }))
        .reverse()
        .map(({ e, depth }) => (
          <motion.article
            key={e.id}
            layout
            initial={false}
            animate={{
              y: depth * 18,
              scale: 1 - depth * 0.05,
              rotate: depth === 0 ? 0 : depth % 2 ? 3 : -3,
              opacity: depth > 2 ? 0 : 1,
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            style={{ zIndex: 10 - depth }}
            className="absolute inset-x-0 top-0 overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_-30px_rgb(11_27_51/0.55)] ring-1 ring-ink/5"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={e.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
              <span className="absolute top-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink capitalize">{e.category}</span>
              <p className="absolute bottom-4 left-5 flex items-center gap-1.5 text-xs font-medium text-white/90">
                <MapPin className="h-3.5 w-3.5" /> {e.venue}
              </p>
            </div>
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-orange uppercase">
                <CalendarDays className="h-3.5 w-3.5" /> {e.id === deck[0].id ? 'Up next' : 'Coming up'} · {formatDate(e.date)}
              </p>
              <h3 className="mt-1.5 text-xl leading-tight font-bold text-ink">{e.title}</h3>
              {depth === 0 && (
                <div className="mt-4 flex items-end justify-between gap-3">
                  <Countdown to={eventStart(e)} compact />
                  <Link href="/#events" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-transform hover:scale-110" aria-label={`See details for ${e.title}`}>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </motion.article>
        ))}
      <div className="absolute -bottom-10 left-1/2 flex -translate-x-1/2 gap-1.5">
        {deck.map((e, k) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setIndex(k)}
            aria-label={`Show ${e.title}`}
            className={`h-1.5 rounded-full transition-all ${k === index ? 'w-6 bg-ink' : 'w-1.5 bg-ink/25 hover:bg-ink/50'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Hero({ upcoming }: { upcoming: SiteEvent[] }) {
  return (
    <section className="relative -mt-16 overflow-hidden pt-16 lg:-mt-[76px] lg:pt-[76px]">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[620px] w-[620px] translate-x-1/4 -translate-y-1/4 rounded-full bg-brand-sky/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[420px] w-[420px] -translate-x-1/3 rounded-full bg-brand-orange/12 blur-3xl" />
      </div>
      <NetworkCanvas className="absolute inset-0 -z-10 h-full w-full opacity-70" />

      <div className="container-page grid items-center gap-16 pt-10 pb-24 sm:pt-14 lg:grid-cols-12 lg:gap-8 lg:pt-16 lg:pb-28">
        <div className="lg:col-span-7">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link
              href="/membership"
              className="group inline-flex items-center gap-2.5 rounded-full bg-white/80 py-1.5 pr-4 pl-1.5 text-sm text-ink-soft shadow-sm ring-1 ring-ink/5 backdrop-blur transition hover:bg-white"
            >
              <span className="relative flex h-6 items-center rounded-full bg-brand-orange px-2.5 text-xs font-semibold text-white">
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 animate-ping rounded-full bg-brand-orange" />
                Open
              </span>
              Membership drive 2026
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="display mt-8 text-[3.1rem] text-ink sm:text-7xl lg:text-[5.6rem]"
          >
            Engineers <br />
            who <RotatingWord />
            <br />
            <span className="relative">
              together
              <svg aria-hidden viewBox="0 0 300 14" className="absolute -bottom-2 left-0 h-3 w-full text-brand-sky" preserveAspectRatio="none">
                <motion.path
                  d="M3 10 C 70 3, 160 2, 297 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, delay: 0.7, ease: 'easeInOut' }}
                />
              </svg>
            </span>
            <span className="text-brand-orange">.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="lead mt-8 max-w-xl">
            The IEEE Student Branch of B.M.S. College of Engineering, Bengaluru. Six technical chapters, 50+ events a year and a
            community of 1,000+ students who make things.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/membership" className="btn btn-primary btn-lg">
              Become a member <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/#chapters" className="btn btn-ghost btn-lg bg-white/50 backdrop-blur">
              Explore chapters
            </Link>
          </motion.div>

          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="mt-14 grid max-w-lg grid-cols-3 gap-6">
            {[
              ['16+', 'years on campus'],
              ['1,000+', 'members'],
              ['50+', 'events a year'],
            ].map(([v, l]) => (
              <div key={l} className="border-l-2 border-brand-orange/60 pl-4">
                <dt className="sr-only">{l}</dt>
                <dd className="display text-3xl text-ink sm:text-4xl">
                  <CountUp value={v} />
                </dd>
                <dd className="mt-1.5 text-xs text-muted sm:text-sm">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div initial={{ opacity: 0, y: 30, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="pb-10 lg:col-span-5">
          <EventDeck upcoming={upcoming} />
        </motion.div>
      </div>
    </section>
  );
}
