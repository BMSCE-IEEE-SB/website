'use client';
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock, MapPin } from 'lucide-react';
import { chapters, eventStart, type SiteEvent } from '@/data/site';
import Reveal from '@/components/site/Reveal';
import Countdown from '@/components/site/Countdown';
import { SectionLabel } from '@/components/site/BrandShapes';
import { cn, dayOfMonth, formatDate, monthShort } from '@/lib/utils';

const chapterOf = (slug: string) => chapters.find((c) => c.slug === slug);

function ChapterTag({ slug, light }: { slug: string; light?: boolean }) {
  const c = chapterOf(slug);
  if (!c) return <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', light ? 'bg-white/15 text-white' : 'bg-ink text-white')}>BRANCH</span>;
  return (
    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: c.color }}>
      {c.code}
    </span>
  );
}

export default function Events({ upcoming, past }: { upcoming: SiteEvent[]; past: SiteEvent[] }) {
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [chapter, setChapter] = useState<string>('all');
  const rail = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const src = view === 'upcoming' ? upcoming : past;
    return chapter === 'all' ? src : src.filter((e) => e.chapter === chapter);
  }, [view, chapter, upcoming, past]);

  const next = upcoming[0];
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * (rail.current.clientWidth * 0.8), behavior: 'smooth' });
  const chapterFilters = [{ slug: 'all', code: 'All' }, { slug: 'branch', code: 'Branch' }, ...chapters.map((c) => ({ slug: c.slug, code: c.code }))];

  return (
    <section id="events" className="relative py-24 sm:py-32">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Reveal>
              <SectionLabel index="03">Events</SectionLabel>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="section-title mt-6">What&apos;s happening</h2>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <div role="tablist" aria-label="Upcoming or past events" className="inline-flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-ink/5">
              {(['upcoming', 'past'] as const).map((v) => (
                <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className="tab capitalize">
                  {v === 'upcoming' ? `Upcoming (${upcoming.length})` : 'Past highlights'}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Featured: the next event with a live countdown */}
        {view === 'upcoming' && next && chapter === 'all' && (
          <Reveal className="mt-14">
            <article className="grain relative grid overflow-hidden rounded-[32px] bg-ink text-white lg:grid-cols-2">
              <div className="relative min-h-[260px] overflow-hidden">
                <img src={next.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.5s] hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink/80 max-lg:bg-gradient-to-t" />
                <span className="absolute top-5 left-5 flex items-center gap-2 rounded-full bg-brand-orange px-3 py-1.5 text-xs font-bold tracking-wide uppercase">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Next up
                </span>
              </div>
              <div className="relative flex flex-col justify-between gap-8 p-7 sm:p-10">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                    <ChapterTag slug={next.chapter} light />
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatDate(next.date)}</span>
                    {next.time && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {next.time} IST</span>}
                  </div>
                  <h3 className="display mt-5 text-4xl sm:text-5xl">{next.title}</h3>
                  <p className="mt-4 max-w-md text-white/75">{next.description}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-white/60"><MapPin className="h-4 w-4" /> {next.venue}</p>
                </div>
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <Countdown to={eventStart(next)} light />
                  <a href={next.registrationUrl} className="btn btn-primary btn-lg">
                    Register <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          </Reveal>
        )}

        <div className="mt-12 flex items-center justify-between gap-4">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {chapterFilters.map((f) => {
              const c = chapterOf(f.slug);
              const on = chapter === f.slug;
              return (
                <button
                  key={f.slug}
                  type="button"
                  onClick={() => setChapter(f.slug)}
                  aria-pressed={on}
                  className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wide transition-all', on ? 'text-white shadow-md' : 'bg-white text-ink-soft ring-1 ring-ink/10 hover:ring-ink/25')}
                  style={on ? { background: c?.color ?? 'var(--color-ink)' } : undefined}
                >
                  {f.code}
                </button>
              );
            })}
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button type="button" onClick={() => scroll(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-ink/10 transition hover:bg-ink hover:text-white" aria-label="Scroll events left">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => scroll(1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-ink/10 transition hover:bg-ink hover:text-white" aria-label="Scroll events right">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={rail} className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto scroll-smooth px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8">
          <AnimatePresence mode="popLayout">
            {list.map((e, i) => (
              <motion.a
                layout
                key={e.id}
                href={view === 'upcoming' ? e.registrationUrl : '/gallery'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="group w-[78%] shrink-0 snap-start sm:w-[340px]"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-paper-2">
                  <img src={e.image} alt="" loading="lazy" className={cn('h-full w-full object-cover transition-transform duration-700 group-hover:scale-105', view === 'past' && 'grayscale-[40%] group-hover:grayscale-0')} />
                  <div className="absolute top-3 left-3"><ChapterTag slug={e.chapter} /></div>
                  <div className="absolute right-3 bottom-3 rounded-2xl bg-white/95 px-3 py-2 text-center shadow-sm backdrop-blur">
                    <p className="font-mono text-[10px] tracking-wider text-muted uppercase">{monthShort(e.date)}</p>
                    <p className="display text-2xl leading-none text-ink">{dayOfMonth(e.date)}</p>
                  </div>
                </div>
                <div className="mt-4 px-1">
                  <p className="text-xs font-semibold tracking-wide text-brand-orange uppercase">{e.category}</p>
                  <h3 className="mt-1 flex items-start justify-between gap-3 text-lg leading-snug font-bold text-ink">
                    {e.title}
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-orange" />
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{e.description}</p>
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
          {list.length === 0 && (
            <div className="flex w-full items-center justify-center rounded-[24px] border-2 border-dashed border-line py-16 text-sm text-muted">
              Nothing here yet. Follow us on Instagram for announcements.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
