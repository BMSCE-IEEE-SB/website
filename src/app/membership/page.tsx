import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Briefcase, Compass, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import NetworkCanvas from '@/components/site/NetworkCanvas';
import { SectionLabel } from '@/components/site/BrandShapes';
import PricingBreakdown from '@/components/membership/PricingBreakdown';
import Faq from '@/components/membership/Faq';

export const metadata: Metadata = {
  title: 'Become a member',
  description: 'Join the BMSCE IEEE Student Branch: benefits, pricing, chapters and how to register in five minutes.',
};

const benefits = [
  {
    icon: Users,
    title: 'Networking & Mentorship',
    text: 'Connect with peers, professionals, and researchers, and get guidance from experienced engineers through IEEE programs.',
  },
  {
    icon: Briefcase,
    title: 'Career Growth',
    text: 'Use job boards, resume reviews, internship openings, and a globally respected credential to stand out to employers.',
  },
  {
    icon: Trophy,
    title: 'Events & Competitions',
    text: 'Attend conferences at discounted student rates and take part in hackathons, design challenges, and project showcases.',
  },
  {
    icon: Zap,
    title: 'Skills & Workshops',
    text: 'Join hands-on sessions on AI, VLSI, IoT, and robotics, and get exposure to cutting-edge research and chances to publish.',
  },
  {
    icon: Compass,
    title: 'Leadership & Service',
    text: 'Build leadership skills by running branch events and committees, and contribute to community and humanitarian projects.',
  },
  {
    icon: Sparkles,
    title: 'Funding & Savings',
    text: 'Become eligible for scholarships, grants, and awards, and save on software, tools, books, and event registrations.',
  },
];



export default function MembershipPage() {
  return (
    <>
      <section className="relative -mt-16 overflow-hidden pt-16 lg:-mt-[76px] lg:pt-[76px]">
        <NetworkCanvas className="absolute inset-0 -z-10 h-full w-full opacity-50" />
        <div className="container-page pt-12 pb-20 lg:pt-20 lg:pb-28">
          <div className="max-w-2xl">
            <SectionLabel index="2026">Membership drive</SectionLabel>
            <h1 className="display mt-6 text-5xl text-ink sm:text-7xl">
              Join the branch.
              <br />
              <span className="text-brand-orange">Get the network.</span>
            </h1>
            <p className="lead mt-6 max-w-lg">
              One membership gets you into IEEE worldwide, the BMSCE IEEE Student Branch and any chapters you pick. Registration takes about five minutes.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="#pricing" className="btn btn-primary btn-lg">
                See pricing & register <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn btn-ghost btn-lg bg-white/60">
                Already applied? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionLabel index="01">What you get</SectionLabel>
            <h2 className="section-title mt-6 max-w-3xl">More than a certificate</h2>
          </Reveal>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 80} className="group">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper text-brand-orange transition-all duration-300 group-hover:-rotate-6 group-hover:bg-brand-orange group-hover:text-white">
                  <b.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-ink">{b.title}</h3>
                <p className="mt-2 text-ink-soft">{b.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 sm:py-28">
        <div className="container-page">
          <PricingBreakdown />
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <SectionLabel index="03">FAQ</SectionLabel>
            <h2 className="section-title mt-6">Questions, answered</h2>
            <p className="lead mt-5">Still unsure? Reach out to us at <a href="tel:+917999180075" className="font-semibold text-ink hover:underline">+91 7999180075</a></p>
          </Reveal>
          <div className="lg:col-span-8">
            <Faq />
          </div>
        </div>
      </section>
    </>
  );
}
