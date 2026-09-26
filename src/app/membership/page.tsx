import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Globe, Handshake, Trophy, Users, Zap } from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import Tilt from '@/components/site/Tilt';
import MembershipCard from '@/components/site/MembershipCard';
import NetworkCanvas from '@/components/site/NetworkCanvas';
import { SectionLabel } from '@/components/site/BrandShapes';
import PriceCalculator from '@/components/membership/PriceCalculator';
import Faq from '@/components/membership/Faq';

export const metadata: Metadata = {
  title: 'Become a member',
  description: 'Join the BMSCE IEEE Student Branch: benefits, pricing, chapters and how to register in five minutes.',
};

const benefits = [
  { icon: BookOpen, title: 'IEEE Xplore access', text: 'Millions of papers, standards and conference proceedings for your projects and research.' },
  { icon: Trophy, title: 'Competitions', text: 'IEEEXtreme, hackathons and design contests, with member-only discounts on entry.' },
  { icon: Users, title: 'Mentorship', text: 'Seniors, alumni and industry engineers who answer your questions and review your work.' },
  { icon: Zap, title: 'Hands-on workshops', text: 'Lab sessions and bootcamps every month, from PCB design to machine learning.' },
  { icon: Handshake, title: 'Industry connections', text: 'Talks, visits and recruiter access through our partner companies.' },
  { icon: Globe, title: 'A global network', text: 'IEEE.org membership connects you to 400,000+ engineers in 160 countries.' },
];

const steps = [
  ['Create an account', 'Use your college email. It takes 30 seconds.'],
  ['Add your details', 'Name, USN, department and year.'],
  ['Choose chapters', 'Add the communities you want to be part of.'],
  ['Pay with UPI', 'Scan, pay and upload the screenshot. We verify within 2–3 days.'],
];

export default function MembershipPage() {
  return (
    <>
      <section className="relative -mt-16 overflow-hidden pt-16 lg:-mt-[76px] lg:pt-[76px]">
        <NetworkCanvas className="absolute inset-0 -z-10 h-full w-full opacity-50" />
        <div className="container-page grid items-center gap-14 pt-12 pb-20 lg:grid-cols-2 lg:pt-20 lg:pb-28">
          <div>
            <SectionLabel index="2026">Membership drive</SectionLabel>
            <h1 className="display mt-6 text-5xl text-ink sm:text-7xl">
              Join the branch.
              <br />
              <span className="text-brand-orange">Get the network.</span>
            </h1>
            <p className="lead mt-6 max-w-lg">
              One membership gets you into IEEE worldwide, the BMSCE branch and any chapters you pick. Registration takes about five minutes.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="#pricing" className="btn btn-primary btn-lg">
                Build your membership <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn btn-ghost btn-lg bg-white/60">
                Already applied? Sign in
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md">
            <Tilt className="rounded-[22px]" max={12}>
              <MembershipCard data={{ name: 'Your Name', usn: '1BM26XX000', department: 'Your dept', chapters: ['CS', 'WIE'], status: 'verified' }} />
            </Tilt>
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
          <Reveal>
            <SectionLabel index="02">Pricing</SectionLabel>
            <h2 className="section-title mt-6">Build your membership</h2>
            <p className="lead mt-4 max-w-xl">Base membership is included. Tap the chapters you want and watch the total update.</p>
          </Reveal>
          <div className="mt-12">
            <PriceCalculator />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionLabel index="03">How it works</SectionLabel>
            <h2 className="section-title mt-6">Four steps, five minutes</h2>
          </Reveal>
          <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 90} className="relative">
                <span className="display text-7xl text-brand-orange/20">0{i + 1}</span>
                <h3 className="mt-2 text-xl font-bold text-ink">{t}</h3>
                <p className="mt-2 text-ink-soft">{d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <SectionLabel index="04">FAQ</SectionLabel>
            <h2 className="section-title mt-6">Questions, answered</h2>
            <p className="lead mt-5">Still unsure? Write to us at ieee@bmsce.ac.in.</p>
          </Reveal>
          <div className="lg:col-span-8">
            <Faq />
          </div>
        </div>
      </section>
    </>
  );
}
