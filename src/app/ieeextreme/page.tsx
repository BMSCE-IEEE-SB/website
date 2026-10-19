import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  Gift,
  Laptop,
  Medal,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import NetworkCanvas from '@/components/site/NetworkCanvas';
import Countdown from '@/components/site/Countdown';
import { SectionLabel } from '@/components/site/BrandShapes';
import VtoolsInstructions from '@/components/xtreme/VtoolsInstructions';
import { XTREME_20_REGISTRATION_END_UTC } from '@/lib/xtreme';

export const metadata: Metadata = {
  title: 'IEEEXtreme 20.0 · BMSCE',
  description:
    "Join IEEEXtreme 20.0 with BMSCE IEEE: the 24-hour global programming competition on October 31, 2026. Form a team of 1–3, get a campus proctor, and register before October 25.",
};

const eventFacts = [
  { icon: CalendarClock, title: '31 October 2026', desc: 'Saturday · 00:00–23:59:59 UTC (05:30 IST onwards)' },
  { icon: Clock, title: '24 Hours', desc: 'One continuous global sprint against thousands of teams' },
  { icon: Users, title: 'Teams of 1–3', desc: 'IEEE student members · max 2 graduate students per team' },
  { icon: Gift, title: 'Free to Enter', desc: 'No fees · certificates, rankings & global prizes' },
];

const prizes = [
  {
    icon: Trophy,
    place: '1st Place',
    title: 'Trip to an IEEE Conference',
    desc: 'Each winning member gets an expenses-paid trip to the IEEE conference of their choice, anywhere in the world (up to $10,000 per team).',
    highlight: true,
  },
  {
    icon: Medal,
    place: '2nd Place',
    title: '$400 per Member',
    desc: 'Each member of the 2nd-place team worldwide receives a US$400 cash award.',
    highlight: false,
  },
  {
    icon: Medal,
    place: '3rd Place',
    title: '$300 per Member',
    desc: 'Each member of the 3rd-place team worldwide receives a US$300 cash award.',
    highlight: false,
  },
  {
    icon: Award,
    place: '4th – 10th Place',
    title: 'Merch Bundle',
    desc: 'Each member of the 4th through 10th ranked teams receives a special IEEEXtreme merchandise bundle.',
    highlight: false,
  },
];

const highlights = [
  {
    icon: Users,
    title: 'Teams of 1 to 3 Members',
    desc: 'Compete solo or team up with up to two friends. Work together, brainstorm solutions, and share the challenge.',
  },
  {
    icon: Code2,
    title: 'All Skill Levels Welcome',
    desc: 'You don’t have to be a competitive coding master! Challenges range from fun, beginner-friendly logic problems to advanced algorithmic puzzles.',
  },
  {
    icon: ShieldCheck,
    title: 'Campus Proctor Provided',
    desc: 'Every team needs an IEEE faculty proctor. BMSCE IEEE arranges and assigns approved faculty proctors to your squad so you don’t have to find one.',
  },
  {
    icon: Laptop,
    title: 'On-Campus Hackathon Labs',
    desc: 'Code with your squad directly from BMSCE campus computer labs with high-speed internet, power backup, snacks, and technical support.',
  },
  {
    icon: Sparkles,
    title: 'Beginner-Friendly Onboarding',
    desc: 'Practice tasks, sample problems, and teammate support help first-timers ramp up fast before competition day.',
  },
  {
    icon: Award,
    title: '100% Free & Certified',
    desc: 'Zero registration fees for IEEE members. Every active team receives an official global IEEE certificate and international ranking.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Assemble Your Team',
    desc: 'Pick an awesome team name and gather the IEEE member numbers and emails for your 1 to 3 team members.',
  },
  {
    step: '02',
    title: 'Register on BMSCE Portal',
    desc: 'Your team lead signs in and enters the squad details. Registration takes just a couple of minutes to complete.',
  },
  {
    step: '03',
    title: 'Get Proctor & Confirm on vTools',
    desc: 'Check your Team Dashboard for your assigned faculty proctor, then finalize your squad entry on the official IEEE vTools platform.',
  },
  {
    step: '04',
    title: 'Compete on October 31',
    desc: 'Join us on campus on competition day, solve problems, learn together, and cheer your team up the global leaderboard!',
  },
];

const rules = [
  {
    title: 'Team Eligibility',
    desc: '1–3 IEEE student or graduate-student members per team, with at most 2 graduate students. All members must be 18+ at registration.',
  },
  {
    title: 'Proctor Required',
    desc: 'Every team needs a higher-grade IEEE member as proctor. One proctor can monitor up to 20 teams; BMSCE assigns yours.',
  },
  {
    title: 'Competition Window',
    desc: 'The contest runs 00:00:00–23:59:59 UTC on 31 October 2026. Partial credit is awarded per test case solved.',
  },
  {
    title: 'Platform & Languages',
    desc: 'Compete on CSAcademy in any supported language listed on their environment page — Python, C++, Java and more.',
  },
  {
    title: 'Fair Play',
    desc: 'Sharing code between teams means disqualification. Internet and AI use must be referenced; unreferenced reuse risks a plagiarism ban.',
  },
  {
    title: 'Certificates',
    desc: 'Every active participant — score above zero with a confirmed proctor — earns a digital certificate and global rank.',
  },
];

const faqs = [
  {
    q: 'What is IEEEXtreme 20.0?',
    a: 'IEEEXtreme is a global 24-hour programming challenge where teams of IEEE student members — advised and proctored by an IEEE member — compete simultaneously to solve a set of programming problems. The 20th edition runs on 31 October 2026.',
  },
  {
    q: 'When does registration close?',
    a: 'Official registration ends on 25 October 2026 at 23:59:59 UTC. Register your squad on this portal early so your proctor is assigned in time for the vTools step.',
  },
  {
    q: 'Do I need prior competitive programming experience?',
    a: 'Not at all! Problems span multiple difficulty levels, starting with approachable challenges. Warm up anytime on the CSAcademy IEEEXtreme practice community with tasks going back to Xtreme 10.0.',
  },
  {
    q: 'What programming languages can we use?',
    a: 'Each task can be answered in any language supported by the competition platform — see the CSAcademy environment page for the current list. Different teammates can use different languages.',
  },
  {
    q: 'Do we need to find our own faculty proctor?',
    a: 'No! The BMSCE IEEE Student Branch coordinates directly with IEEE faculty members. Once you register your squad on this portal, an approved BMSCE faculty proctor will be assigned to your team automatically.',
  },
  {
    q: 'Who can be on my team?',
    a: 'Any 1 to 3 students currently enrolled at BMS College of Engineering who have an active IEEE student membership, with at most 2 graduate students on a team.',
  },
  {
    q: 'Can we participate from campus overnight?',
    a: 'Yes! BMSCE IEEE hosts an official proctored venue on campus with lab systems, uninterrupted power, fast Wi-Fi, refreshments, and a vibrant hackathon atmosphere so everyone can code comfortably and safely.',
  },
  {
    q: 'What do participants receive?',
    a: 'All active participants earn official IEEE digital certificates and global rankings. Top teams worldwide win a conference trip, cash awards, and merchandise bundles.',
  },
];

export default function IEEEXtremeLandingPage() {
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
                <Sparkles className="h-3.5 w-3.5" />
                <span>IEEEXtreme 20.0 · Worldwide 24-Hour Programming Hackathon</span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="display mt-6 text-5xl text-ink sm:text-6xl md:text-7xl">
                Be Xtreme
                <br />
                <span className="text-brand-orange">With Us.</span>
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="lead mx-auto mt-6 max-w-2xl text-ink-soft">
                24 hours of competitive programming is waiting for you. Form your team of 1–3 members,
                get assigned a campus proctor, and compete globally on October 31, 2026.
              </p>
            </Reveal>

            {/* Registration countdown */}
            <Reveal delay={200}>
              <div className="mx-auto mt-8 inline-flex flex-col items-center justify-center rounded-3xl border border-line bg-white/90 p-5 shadow-lg backdrop-blur-md sm:flex-row sm:gap-6">
                <div className="mb-3 sm:mb-0 sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">Registration ends in</span>
                  <p className="text-xs text-muted">Closes Oct 25, 2026 · 23:59 UTC</p>
                </div>
                <Countdown to={XTREME_20_REGISTRATION_END_UTC} />
              </div>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={260}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/ieeextreme/register" className="btn btn-primary btn-lg shadow-xl">
                  Register Your Team <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/ieeextreme/team" className="btn btn-ghost btn-lg bg-white/70">
                  Team Dashboard
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted">
                Free participation for all BMSCE students · No prior competitive programming experience required
              </p>
            </Reveal>
          </div>

          {/* Event facts strip */}
          <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {eventFacts.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 60}>
                  <div className="flex h-full items-start gap-3 rounded-2xl border border-line bg-white/80 p-4 shadow-sm backdrop-blur">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-ink">{f.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">{f.desc}</span>
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* What is IEEEXtreme */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <SectionLabel index="01">What is IEEEXtreme?</SectionLabel>
              <h2 className="section-title mt-4">The World&apos;s Biggest Collegiate Hackathon</h2>
              <p className="lead mt-4">
                IEEEXtreme is a global challenge in which teams of IEEE student members — advised and
                proctored by an IEEE member, and supported by their Student Branch — compete in a
                24-hour time span to solve a set of programming problems.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                Thousands of teams from universities across the globe compete simultaneously. Tasks span
                easy to hardest difficulty, every submission earns partial credit per test case, and the
                leaderboard stays live all day. The BMSCE Student Branch runs a proctored on-campus venue
                so your squad can compete together.
              </p>
              <a
                href="https://ieeextreme.org"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:underline"
              >
                Official competition website <ExternalLink className="h-4 w-4" />
              </a>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-5">
              <div className="rounded-3xl bg-ink p-6 text-white sm:p-8">
                <h3 className="text-lg font-bold">20.0 at a Glance</h3>
                <dl className="mt-5 space-y-4 text-sm">
                  {[
                    ['Competition', '31 October 2026 · 24 hours'],
                    ['Registration ends', '25 October 2026 · 23:59 UTC'],
                    ['Team size', '1–3 IEEE student members'],
                    ['Proctor', 'Assigned BMSCE faculty member'],
                    ['Venue', 'On-campus labs + remote proctoring'],
                    ['Platform', 'CSAcademy competition workspace'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                      <dt className="text-white/60">{k}</dt>
                      <dd className="text-right font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section className="border-t border-line py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="text-center">
              <SectionLabel index="02">Global Prizes</SectionLabel>
              <h2 className="section-title mt-4">What Winners Take Home</h2>
              <p className="lead mx-auto mt-3 max-w-xl">
                Official IEEEXtreme 20.0 prizes, awarded by IEEE to the top teams in the world.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {prizes.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.place} delay={i * 70}>
                  <div
                    className={
                      p.highlight
                        ? 'flex h-full flex-col rounded-3xl bg-ink p-7 text-white shadow-xl'
                        : 'flex h-full flex-col rounded-3xl border border-line bg-white p-7 shadow-sm'
                    }
                  >
                    <span
                      className={
                        p.highlight
                          ? 'flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange text-white'
                          : 'flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy/10 text-brand-navy'
                      }
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <p className={`mt-5 text-xs font-bold uppercase tracking-wider ${p.highlight ? 'text-brand-orange' : 'text-muted'}`}>{p.place}</p>
                    <h3 className={`mt-1 text-xl font-bold ${p.highlight ? 'text-white' : 'text-ink'}`}>{p.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${p.highlight ? 'text-white/75' : 'text-ink-soft'}`}>{p.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs text-muted">Prizes per ieeextreme.org. Taxes and duties are each winner&apos;s responsibility.</p>
        </div>
      </section>

      {/* Why join through BMSCE */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="text-center">
              <SectionLabel index="03">Why BMSCE</SectionLabel>
              <h2 className="section-title mt-4">Why Join Through BMSCE IEEE</h2>
              <p className="lead mx-auto mt-3 max-w-xl">
                A weekend of problem solving, learning, collaboration, and high-energy coding with friends.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={idx * 60}>
                  <div className="flex h-full flex-col rounded-3xl border border-line bg-paper/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-sky hover:bg-white hover:shadow-xl">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-md">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="text-center">
              <SectionLabel index="04">Easy Registration</SectionLabel>
              <h2 className="section-title mt-4">How It Works in 4 Simple Steps</h2>
              <p className="lead mx-auto mt-3 max-w-xl">
                From finding your squad mates to competing on hackathon day — we guide you every step of the way.
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
              New to Competitive Coding?
            </h4>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              IEEEXtreme is one of the friendliest platforms to dive into algorithms. Warm up on the
              official practice community with tasks going back to Xtreme 10.0, then form a team with
              your classmates and discover how much you can learn in 24 hours!
            </p>
            <a
              href="https://csacademy.com/ieeextreme-practice/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy hover:underline"
            >
              Practice on CSAcademy <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Rules essentials */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="text-center">
              <SectionLabel index="05">Rules Essentials</SectionLabel>
              <h2 className="section-title mt-4">Know Before You Compete</h2>
              <p className="lead mx-auto mt-3 max-w-xl">
                The key official rules, condensed. The full rulebook always wins on competition day.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rules.map((r, i) => (
              <Reveal key={r.title} delay={i * 60}>
                <div className="h-full rounded-3xl border border-line bg-paper/40 p-6">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-brand-navy" />
                    <h3 className="text-base font-bold text-ink">{r.title}</h3>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{r.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-8 text-center">
            <a
              href="https://ieeextreme.org/rules/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:underline"
            >
              Read the full official rules <ExternalLink className="h-4 w-4" />
            </a>
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t border-line py-20 sm:py-28">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <SectionLabel index="06">FAQ</SectionLabel>
              <h2 className="section-title mt-4">Frequently Asked Questions</h2>
              <p className="lead mt-4">
                Have questions about participating, forming a team, or the on-campus lab setup? We&apos;ve got answers.
              </p>
              <div className="mt-8 rounded-2xl bg-paper p-5">
                <p className="text-xs font-semibold text-muted">BMSCE IEEE Support</p>
                <p className="mt-1 text-sm font-semibold text-ink">ieee.sb@bmsce.ac.in</p>
                <p className="text-xs text-ink-soft mt-0.5">Basavanagudi, Bengaluru 560019</p>
              </div>
            </Reveal>

            <div className="space-y-4 lg:col-span-7">
              {faqs.map((f, idx) => (
                <Reveal key={f.q} delay={idx * 50}>
                  <div className="rounded-2xl border border-line bg-white p-6 transition-colors hover:border-ink/20">
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

      {/* Official vTools registration guide */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <SectionLabel index="07">Official Guide</SectionLabel>
                <h2 className="section-title mt-4">vTools Registration Instructions</h2>
                <p className="lead mt-4">
                  After registering your squad on this gateway, every team must complete the official
                  IEEE portal entry. Follow these steps exactly — and don&apos;t skip the Ambassador ID.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100} className="lg:col-span-7">
              <VtoolsInstructions />
            </Reveal>
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
            Registration closes October 25, 2026. Gather your friends, pick your team name, and lock your squad in.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/ieeextreme/register" className="btn btn-primary btn-lg shadow-xl">
              Register Your Team Now <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://xtreme.vtools.ieee.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg border border-white/25 text-white hover:bg-white/10"
            >
              Official vTools Portal <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
