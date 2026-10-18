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
  title: 'IEEEXtreme 20.0 · BMSCE',
  description:
    "Join IEEE's flagship algorithmic programming competition in the world’s biggest collegiate hackathon. Form your team of 1–3 members, get assigned a campus proctor, and compete globally on October 31, 2026.",
};

const EVENT_START = new Date('2026-10-31T05:30:00+05:30').getTime();

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
    icon: Clock,
    title: '24 Hours of Pure Coding',
    desc: 'Solve exciting problems at your own pace over 24 continuous hours, testing your logic and racing against thousands of students worldwide.',
  },
  {
    icon: Laptop,
    title: 'On-Campus Hackathon Labs',
    desc: 'Code with your squad directly from BMSCE campus computer labs with high-speed internet, power backup, snacks, and technical support.',
  },
  {
    icon: Award,
    title: '100% Free & Certified',
    desc: 'Zero registration fees for IEEE members. Every team that submits solutions receives an official global IEEE certificate and international ranking.',
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
    desc: 'Your team lead signs in and enters the squad details. The registration takes just a couple of minutes to complete.',
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

const faqs = [
  {
    q: 'What is IEEEXtreme 20.0?',
    a: 'IEEEXtreme is a legendary 24-hour virtual programming challenge where student teams from universities across the globe compete simultaneously to solve a series of algorithmic and logic problems. It is the flagship competitive programming hackathon of IEEE.',
  },
  {
    q: 'Do I need prior competitive programming experience?',
    a: 'Not at all! Problems are curated across multiple difficulty levels, starting with approachable beginner challenges. It is a fantastic environment to learn, collaborate with teammates, and build real algorithmic intuition.',
  },
  {
    q: 'What programming languages can we use?',
    a: 'You can use virtually all major languages, including Python, C++, C, Java, JavaScript, Kotlin, Go, and more on the competition platform. Different teammates can even tackle different problems in their preferred languages.',
  },
  {
    q: 'Do we need to find our own faculty proctor?',
    a: 'No! The BMSCE IEEE Student Branch coordinates directly with IEEE faculty members. Once you register your squad on this portal, an approved BMSCE faculty proctor will be assigned to your team automatically.',
  },
  {
    q: 'Who can be on my team?',
    a: 'Any 1 to 3 students currently enrolled at BMS College of Engineering who have an active IEEE student membership. If you or your teammates need an IEEE membership, you can join easily through the college branch.',
  },
  {
    q: 'Can we participate from campus overnight?',
    a: 'Yes! BMSCE IEEE hosts an official proctored venue on campus with lab systems, uninterrupted power, fast Wi-Fi, refreshments, and a vibrant hackathon atmosphere so everyone can code comfortably and safely.',
  },
  {
    q: 'What do participants receive?',
    a: 'All participating teams that submit working solutions receive official IEEE certificates and global rankings. Top teams worldwide earn international acclaim, prizes, and sponsored swag.',
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
                Code. Compete.
                <br />
                <span className="text-brand-orange">Conquer 24 Hours.</span>
              </h1>
            </Reveal>

            <Reveal delay={140}>
              <p className="lead mx-auto mt-6 max-w-2xl text-ink-soft">
                Join IEEE&apos;s flagship algorithmic programming competetion in the world’s biggest collegiate hackathon. Form your team of 1–3 members, get assigned a campus proctor, and compete globally on October 31, 2026.
              </p>
            </Reveal>

            {/* Countdown card */}
            <Reveal delay={200}>
              <div className="mx-auto mt-8 inline-flex flex-col items-center justify-center rounded-3xl border border-line bg-white/90 p-5 shadow-lg backdrop-blur-md sm:flex-row sm:gap-6">
                <div className="mb-3 sm:mb-0 sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">Hackathon Countdown</span>
                  <p className="text-xs text-muted">Starts Oct 31, 2026 · 05:30 IST</p>
                </div>
                <Countdown to={EVENT_START} />
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
        </div>
      </section>

      {/* Highlights */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="text-center">
              <SectionLabel index="01">What to Expect</SectionLabel>
              <h2 className="section-title mt-4">Why You Should Join Xtreme 20.0</h2>
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

      {/* Simple 4-Step Journey */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="text-center">
              <SectionLabel index="02">Easy Registration</SectionLabel>
              <h2 className="section-title mt-4">How It Works in 4 Simple Steps</h2>
              <p className="lead mx-auto mt-3 max-w-xl">
                From finding your squad mates to competing on hackathon day—we guide you every step of the way.
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
              IEEEXtreme is one of the friendliest platforms to dive into algorithms. You can write your solutions in Python, C, C++, Java, JavaScript, and dozens of other languages. Form a team with your classmates and discover how much you can learn in 24 hours!
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
            Gather your friends, pick your team name, and get ready for the biggest coding adventure of the year.
          </p>
          <div className="mt-8">
            <Link href="/ieeextreme/register" className="btn btn-primary btn-lg shadow-xl">
              Register Your Team Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
