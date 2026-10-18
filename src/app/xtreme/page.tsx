import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Code2,
  Laptop,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import NetworkCanvas from '@/components/site/NetworkCanvas';
import Countdown from '@/components/site/Countdown';
import { SectionLabel } from '@/components/site/BrandShapes';

export const metadata: Metadata = {
  title: 'IEEEXtreme 20.0 · BMSCE Registration Gateway',
  description:
    'Register your BMSCE team for IEEEXtreme 20.0, the premier global 24-hour programming competition. Form a team, get assigned a proctor, and compete on campus.',
};

const EVENT_START = new Date('2026-10-24T05:30:00+05:30').getTime();

const rules = [
  {
    icon: Users,
    title: 'Lead-Delegated Registration',
    desc: 'Only the Team Lead logs in and registers the team on our portal, entering details for up to two teammates.',
  },
  {
    icon: Code2,
    title: 'Team Size: 1 to 3 Members',
    desc: 'You can compete solo or in a team of up to three students. All members must belong to BMSCE.',
  },
  {
    icon: ShieldCheck,
    title: 'Active IEEE Members Only',
    desc: 'All participants must have an active IEEE membership number verified against BMSCE branch records.',
  },
  {
    icon: Award,
    title: 'Proctor Assigned Locally',
    desc: 'You do not need to hunt for a proctor. The BMSCE IEEE Student Branch assigns authorized faculty proctors to each verified team.',
  },
  {
    icon: Laptop,
    title: '24-Hour Overnight On Campus',
    desc: 'Participate directly from the BMSCE campus labs with high-speed internet, power backup, food, and logistics provided.',
  },
  {
    icon: Sparkles,
    title: '100% Free Participation',
    desc: 'There are zero registration fees for IEEEXtreme 20.0. The portal is dedicated purely to team formation and local coordination.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Register on BMSCE Gateway',
    desc: 'The Team Lead signs in to bmsceieee.com, inputs the team name, and enters IEEE member IDs and college details for all 1–3 members.',
  },
  {
    step: '02',
    title: 'Get Your Proctor Assigned',
    desc: 'Our student branch assigns an IEEE-certified Proctor to your team in our portal database and notifies your team lead.',
  },
  {
    step: '03',
    title: 'Register on Official IEEE vTools',
    desc: 'The Team Lead registers the team on https://xtreme.vtools.ieee.org/ using your assigned proctor number, and confirms it on your dashboard.',
  },
  {
    step: '04',
    title: 'Compete for 24 Hours on Campus',
    desc: 'Join us at the BMSCE computer labs for 24 continuous hours of algorithmic problem solving, ranking globally among thousands of teams.',
  },
];

const faqs = [
  {
    q: 'What is IEEEXtreme 20.0?',
    a: 'IEEEXtreme is a global virtual challenge where teams of IEEE Student Members compete in a 24-hour time span against each other to solve a set of programming problems. It is the flagship competitive programming hackathon of IEEE.',
  },
  {
    q: 'Can non-IEEE members join my team?',
    a: 'No. Every participant must be an active IEEE member with a valid IEEE Member Number. If your teammates need to register for IEEE membership, they can do so on bmsceieee.com/membership.',
  },
  {
    q: 'Can teammates be from other colleges?',
    a: 'No. For our local campus prerequisite gateway, all team members must be enrolled students of BMS College of Engineering.',
  },
  {
    q: 'Do I need to find my own proctor?',
    a: 'No! Our Student Branch coordinates with faculty and IEEE senior members to provide approved proctors for all registered BMSCE teams. We assign proctor details directly in your portal.',
  },
  {
    q: 'Can we change our team members later?',
    a: 'You can update your team details on our portal as long as you have not completed and confirmed your official registration on IEEE vTools.',
  },
  {
    q: 'Is offline attendance on campus mandatory?',
    a: 'BMSCE IEEE hosts an official proctored venue on campus with lab systems, uninterrupted power, network connectivity, refreshments, and snacks so students can stay overnight safely.',
  },
];

export default function XtremeLandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative -mt-16 overflow-hidden pt-20 pb-20 lg:-mt-[76px] lg:pt-32 lg:pb-28">
        <NetworkCanvas className="absolute inset-0 -z-10 h-full w-full opacity-40" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-b from-brand-sky/15 via-brand-orange/5 to-transparent" />

        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-xs font-semibold text-brand-orange">
                <Clock className="h-3.5 w-3.5" />
                <span>IEEEXtreme 20.0 · Global 24-Hour Programming Competition</span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="display mt-6 text-5xl text-ink sm:text-6xl md:text-7xl">
                Code. Compete.
                <br />
                <span className="text-brand-orange">Conquer 24 Hours.</span>
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="lead mx-auto mt-6 max-w-2xl text-ink-soft">
                Join BMSCE’s finest algorithmic programmers in the world’s biggest collegiate hackathon. Form your team of 1–3 members, get assigned a campus proctor, and compete globally on October 24, 2026.
              </p>
            </Reveal>

            {/* Countdown card */}
            <Reveal delay={200}>
              <div className="mx-auto mt-8 inline-flex flex-col items-center justify-center rounded-3xl border border-line bg-white/90 p-5 shadow-lg backdrop-blur-md sm:flex-row sm:gap-6">
                <div className="mb-3 sm:mb-0 sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">Hackathon Countdown</span>
                  <p className="text-xs text-muted">Starts Oct 24, 2026 · 05:30 IST</p>
                </div>
                <Countdown to={EVENT_START} />
              </div>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={260}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/xtreme/register" className="btn btn-primary btn-lg shadow-xl">
                  Register Your Team <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/xtreme/team" className="btn btn-ghost btn-lg bg-white/70">
                  Team Lead Dashboard
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted">
                Only the Team Lead needs an account to register the whole team.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Rules & Highlights */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="text-center">
              <SectionLabel index="01">Competition Rules</SectionLabel>
              <h2 className="section-title mt-4">Local Prerequisite Gateway</h2>
              <p className="lead mx-auto mt-3 max-w-xl">
                Everything you need to know before registering your team on BMSCE IEEE.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rules.map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <Reveal key={rule.title} delay={idx * 60}>
                  <div className="flex h-full flex-col rounded-3xl border border-line bg-paper/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-sky hover:bg-white hover:shadow-xl">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-md">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-ink">{rule.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{rule.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4-Step Registration Process */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="text-center">
              <SectionLabel index="02">Registration Roadmap</SectionLabel>
              <h2 className="section-title mt-4">How It Works in 4 Steps</h2>
              <p className="lead mx-auto mt-3 max-w-xl">
                A simple, stress-free pathway from forming your team to competing on hackathon day.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((st, i) => (
              <Reveal key={st.step} delay={i * 80}>
                <div className="relative flex h-full flex-col rounded-3xl border border-line bg-white p-7 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-extrabold text-brand-orange">{st.step}</span>
                    <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-bold text-muted">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-ink">{st.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{st.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-brand-sky/30 bg-sky-50/60 p-6 text-center sm:p-8">
            <h4 className="text-base font-bold text-brand-navy sm:text-lg">
              Official IEEE vTools Prerequisite Notice
            </h4>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              IEEE requires all teams globally to register with an authorized proctor. By registering here first, the BMSCE IEEE Student Branch pairs you with an approved proctor, so you don&apos;t risk disqualification.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <SectionLabel index="03">FAQ</SectionLabel>
              <h2 className="section-title mt-4">Frequently Asked Questions</h2>
              <p className="lead mt-4">
                Have more questions about IEEEXtreme 20.0 or the BMSCE on-campus hackathon? Reach out to the BMSCE IEEE tech team.
              </p>
              <div className="mt-8 rounded-2xl bg-paper p-5">
                <p className="text-xs font-semibold text-muted">Branch Contact</p>
                <p className="mt-1 text-sm font-semibold text-ink">ieee.sb@bmsce.ac.in</p>
                <p className="text-xs text-ink-soft mt-0.5">Basavanagudi, Bengaluru 560019</p>
              </div>
            </Reveal>

            <div className="space-y-4 lg:col-span-7">
              {faqs.map((f, idx) => (
                <Reveal key={f.q} delay={idx * 50}>
                  <div className="rounded-2xl border border-line bg-paper/40 p-6 transition-colors hover:border-ink/20 hover:bg-paper">
                    <h3 className="text-base font-bold text-ink flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-orange mt-0.5" />
                      <span>{f.q}</span>
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft pl-8">{f.a}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="container-page text-center">
          <h2 className="display text-3xl sm:text-4xl md:text-5xl">
            Ready to represent <span className="text-brand-orange">BMSCE</span> at IEEEXtreme 20.0?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Assemble your team, sign in with your student account, and claim your spot for the 24-hour global codefest.
          </p>
          <div className="mt-8">
            <Link href="/xtreme/register" className="btn btn-primary btn-lg shadow-xl">
              Register Now — It&apos;s Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

