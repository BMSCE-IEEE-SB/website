/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { chapterBySlug, chapters } from '@/data/site';
import Reveal from '@/components/site/Reveal';
import { Sails } from '@/components/site/BrandShapes';

export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = new Set(chapters.map((c) => c.slug));
  slugs.add('pes');
  slugs.add('sc');
  slugs.add('pels');
  return Array.from(slugs).map((slug) => ({ slug }));
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
            {c.logo ? (
              <span className="flex h-16 w-32 items-center justify-center rounded-2xl bg-white px-3 py-2">
                <Image src={c.logo} alt={`${c.name} logo`} width={180} height={90} className="max-h-12 w-full object-contain" priority />
              </span>
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Icon className="h-7 w-7" />
              </span>
            )}
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold tracking-wide backdrop-blur">{c.code}</span>
          </div>
          <h1 className="display mt-6 max-w-4xl text-5xl sm:text-7xl lg:text-8xl">{c.title ?? c.name}</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">
            {c.comingSoon ? c.description : `${c.tagline}. ${c.description}`}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/membership" className="btn btn-lg bg-white text-ink hover:-translate-y-0.5">
              Join {c.code} with your membership <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {c.comingSoon ? (
        <section className="py-24 sm:py-32">
          <div className="container-page">
            <Reveal className="max-w-2xl">
              <h2 className="section-title">Content Coming Soon</h2>
              <p className="lead mt-4 text-ink-soft">
                Official handbook, past events, and activity highlights for this chapter are currently being updated.
              </p>
            </Reveal>
          </div>
        </section>
      ) : (
        <>
          {/* About Section */}
          {c.aboutUs && c.aboutUs.length > 0 ? (
            <section className="border-b border-line py-20 sm:py-28">
              <div className="container-page grid gap-12 lg:grid-cols-12">
                <Reveal className="lg:col-span-5">
                  <h2 className="section-title">{c.aboutTitle ?? 'About Us'}</h2>
                </Reveal>
                <Reveal delay={100} className="space-y-5 lg:col-span-7">
                  {c.aboutUs.map((p) => (
                    <p key={p} className="lead">{p}</p>
                  ))}
                </Reveal>
              </div>
            </section>
          ) : c.about.length > 0 ? (
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
            </section>
          ) : null}

          {/* What We Do */}
          {c.whatWeDo && c.whatWeDo.length > 0 && (
            <section className="py-20 sm:py-28 border-b border-line">
              <div className="container-page grid gap-12 lg:grid-cols-12">
                <Reveal className="lg:col-span-5">
                  <h2 className="section-title">What We Do</h2>
                </Reveal>
                <Reveal delay={100} className="space-y-5 lg:col-span-7">
                  {c.whatWeDo.map((p) => (
                    <p key={p} className="lead">{p}</p>
                  ))}
                </Reveal>
              </div>
            </section>
          )}

          {/* Focus Areas */}
          {c.focus.length > 0 && (
            <section className="py-16">
              <div className="container-page grid gap-4 sm:grid-cols-2">
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
          )}

          {/* Our Past Events */}
          {c.pastEvents && c.pastEvents.length > 0 && (
            <section className="bg-white py-20 sm:py-28 border-b border-line">
              <div className="container-page grid gap-12 lg:grid-cols-12">
                <Reveal className="lg:col-span-5">
                  <h2 className="section-title">Our Past Events</h2>
                </Reveal>
                <div className="lg:col-span-7">
                  <ul className="space-y-4 list-disc pl-5 text-lg font-medium text-ink">
                    {c.pastEvents.map((a, i) => (
                      <Reveal as="li" key={a} delay={i * 40} className="leading-relaxed">
                        {a}
                      </Reveal>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Flagship Events */}
          {c.flagshipEvents && c.flagshipEvents.length > 0 && (
            <section className="py-20 sm:py-28 border-b border-line">
              <div className="container-page grid gap-12 lg:grid-cols-12">
                <Reveal className="lg:col-span-5">
                  <h2 className="section-title">Flagship Events</h2>
                </Reveal>
                <div className="lg:col-span-7">
                  <ul className="space-y-6 list-disc pl-5">
                    {c.flagshipEvents.map((fe, i) => (
                      <Reveal as="li" key={fe.title} delay={i * 60} className="text-ink">
                        <span className="text-lg font-bold text-ink sm:text-xl">{fe.title}</span>
                        {fe.description && (
                          <p className="mt-2 text-base font-normal leading-relaxed text-ink-soft">
                            {fe.description}
                          </p>
                        )}
                      </Reveal>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Other Initiatives */}
          {c.otherInitiatives && c.otherInitiatives.length > 0 && (
            <section className="py-20 sm:py-28 border-b border-line">
              <div className="container-page grid gap-12 lg:grid-cols-12">
                <Reveal className="lg:col-span-5">
                  <h2 className="section-title">Other Initiatives</h2>
                </Reveal>
                <div className="lg:col-span-7">
                  <ul className="space-y-4 list-disc pl-5 text-lg font-medium text-ink">
                    {c.otherInitiatives.map((item, i) => (
                      <Reveal as="li" key={item} delay={i * 40} className="leading-relaxed">
                        {item}
                      </Reveal>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Major Events */}
          {c.majorEvents && c.majorEvents.length > 0 && (
            <section className="bg-white py-20 sm:py-28 border-b border-line">
              <div className="container-page grid gap-12 lg:grid-cols-12">
                <Reveal className="lg:col-span-5">
                  <h2 className="section-title">Major Events</h2>
                </Reveal>
                <div className="lg:col-span-7">
                  <ul className="space-y-4 list-disc pl-5 text-lg font-medium text-ink">
                    {c.majorEvents.map((a, i) => (
                      <Reveal as="li" key={a} delay={i * 40} className="leading-relaxed">
                        {a}
                      </Reveal>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Signature Activities Fallback */}
          {!c.majorEvents && !c.pastEvents && !c.flagshipEvents && c.activities.length > 0 && (
            <section className="bg-white py-20 sm:py-28 border-b border-line">
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
          )}

          {/* Future / Upcoming Events */}
          {c.futureEvents && c.futureEvents.length > 0 && (
            <section className="border-t border-line py-20 sm:py-28">
              <div className="container-page grid gap-12 lg:grid-cols-12">
                <Reveal className="lg:col-span-5">
                  <h2 className="section-title">{c.futureEventsTitle ?? 'Future Events'}</h2>
                </Reveal>
                <div className="lg:col-span-7">
                  <ul className="space-y-6 list-disc pl-5">
                    {c.futureEvents.map((fe, i) => (
                      <Reveal as="li" key={fe.title} delay={i * 60} className="text-ink">
                        <span className="text-lg font-bold text-ink sm:text-xl">{fe.title}</span>
                        {fe.description && (
                          <p className="mt-2 text-base font-normal leading-relaxed text-ink-soft">
                            {fe.description}
                          </p>
                        )}
                      </Reveal>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </>
      )}

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
