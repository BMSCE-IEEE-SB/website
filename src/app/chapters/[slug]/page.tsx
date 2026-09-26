/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, MapPin } from 'lucide-react';
import { chapterBySlug, chapters, eventStart, isPastEvent, splitEvents } from '@/data/site';
import Reveal from '@/components/site/Reveal';
import CountUp from '@/components/site/CountUp';
import Countdown from '@/components/site/Countdown';
import { Sails } from '@/components/site/BrandShapes';
import { formatDate } from '@/lib/utils';

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return chapters.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = chapterBySlug(slug);
  return c ? { title: c.fullName, description: `${c.tagline}. ${c.description}` } : {};
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = chapterBySlug(slug);
  if (!c) notFound();
  const Icon = c.icon;
  const { now, upcoming, past } = splitEvents((e) => e.chapter === c.slug);
  const mine = [...upcoming, ...past];
  const idx = chapters.findIndex((x) => x.slug === c.slug);
  const nextChapter = chapters[(idx + 1) % chapters.length];

  return (
    <>
      {/* Hero */}
      <section className="grain relative overflow-hidden text-white" style={{ background: c.color }}>
        <img src={c.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${c.color} 30%, transparent)` }} />
        <Sails className="absolute -right-20 -bottom-24 h-[420px] w-[420px] animate-spin-slow opacity-10" />
        <div className="container-page relative pt-10 pb-20 sm:pt-14 lg:pb-28">
          <Link href="/#chapters" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All chapters
          </Link>
          <div className="mt-10 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Icon className="h-7 w-7" />
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold tracking-wide backdrop-blur">{c.code}</span>
          </div>
          <h1 className="display mt-6 max-w-4xl text-5xl sm:text-7xl lg:text-8xl">{c.name}</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">{c.tagline}. {c.description}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/membership" className="btn btn-lg bg-white text-ink hover:-translate-y-0.5">
              Join {c.code} with your membership <ArrowRight className="h-4 w-4" />
            </Link>
            {upcoming[0] && (
              <a href="#chapter-events" className="btn btn-outline-light btn-lg">
                See upcoming events
              </a>
            )}
          </div>
          <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/20 pt-8">
            {[
              [c.stats.members, 'members'],
              [c.stats.events, 'events a year'],
              [c.stats.founded, 'founded'],
            ].map(([v, l]) => (
              <div key={l}>
                <dd className="display text-4xl sm:text-5xl">{l === 'founded' ? v : <CountUp value={v} />}</dd>
                <dt className="mt-1 text-sm text-white/70">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* About */}
      <section className="py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h2 className="section-title">What we do</h2>
          </Reveal>
          <Reveal delay={100} className="space-y-5 lg:col-span-7">
            {c.about.map((p) => (
              <p key={p} className="lead">{p}</p>
            ))}
          </Reveal>
        </div>

        <div className="container-page mt-16 grid gap-4 sm:grid-cols-2">
          {c.focus.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="group relative h-full overflow-hidden rounded-[26px] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgb(11_27_51/0.4)]">
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: c.color }} />
                <span className="font-mono text-sm" style={{ color: c.color }}>0{i + 1}</span>
                <h3 className="mt-4 text-2xl font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-ink-soft">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Activities */}
      <section className="bg-white py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h2 className="section-title">Signature activities</h2>
            <p className="lead mt-5">What a year in {c.code} usually looks like.</p>
          </Reveal>
          <ul className="divide-y divide-line lg:col-span-7">
            {c.activities.map((a, i) => (
              <Reveal as="li" key={a} delay={i * 60} className="flex items-center gap-5 py-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: c.color }}>
                  <Check className="h-5 w-5" />
                </span>
                <span className="text-lg font-medium text-ink">{a}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Events */}
      <section id="chapter-events" className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <h2 className="section-title">{upcoming.length ? 'Coming up' : 'Recent events'}</h2>
          </Reveal>
          {upcoming[0] && (
            <Reveal className="mt-10">
              <article className="grid overflow-hidden rounded-[28px] bg-ink text-white md:grid-cols-5">
                <img src={upcoming[0].image} alt="" className="h-60 w-full object-cover md:col-span-2 md:h-full" />
                <div className="flex flex-col justify-between gap-6 p-7 sm:p-9 md:col-span-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                      <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatDate(upcoming[0].date)}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {upcoming[0].venue}</span>
                    </p>
                    <h3 className="display mt-4 text-3xl sm:text-4xl">{upcoming[0].title}</h3>
                    <p className="mt-3 text-white/75">{upcoming[0].description}</p>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-5">
                    <Countdown to={eventStart(upcoming[0])} light />
                    <a href={upcoming[0].registrationUrl} className="btn btn-lg text-white" style={{ background: c.color }}>
                      Register <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          )}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...upcoming.slice(1), ...past].map((e, i) => (
              <Reveal key={e.id} delay={i * 60}>
                <article className="group">
                  <div className="aspect-[4/3] overflow-hidden rounded-[22px]">
                    <img src={e.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <p className="mt-4 text-xs font-semibold tracking-wide uppercase" style={{ color: c.color }}>
                    {isPastEvent(e, now) ? 'Past' : 'Upcoming'} · {formatDate(e.date)}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{e.title}</h3>
                  <p className="mt-1 text-sm text-muted">{e.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
          {mine.length === 0 && <p className="mt-8 text-muted">The {c.code} calendar for this term is being planned. Check back soon.</p>}
        </div>
      </section>

      {/* Next chapter */}
      <section className="pb-20">
        <div className="container-page">
          <Link href={`/chapters/${nextChapter.slug}`} className="group grain relative flex flex-col justify-between gap-6 overflow-hidden rounded-[32px] p-8 text-white sm:flex-row sm:items-center sm:p-12" style={{ background: nextChapter.color }}>
            <div>
              <p className="text-sm font-semibold text-white/75">Next chapter</p>
              <p className="display mt-2 text-4xl sm:text-5xl">{nextChapter.name}</p>
            </div>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:translate-x-2 group-hover:rotate-[-45deg]">
              <ArrowRight className="h-6 w-6" />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
