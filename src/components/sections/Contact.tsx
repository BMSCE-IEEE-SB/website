'use client';

import { useState } from 'react';
import { ArrowUpRight, Mail, MapPin, Phone, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { contactInfo } from '@/data/site';
import Reveal from '@/components/site/Reveal';
import { SectionLabel } from '@/components/site/BrandShapes';
import { cn } from '@/lib/utils';

const topics = ['Partnership', 'Sponsorship', 'Guest talk', 'Membership', 'Something else'];

export default function Contact() {
  const [topic, setTopic] = useState(topics[0]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Please enter a message');
      return;
    }

    setStatus('loading');

    const subject = `${topic} enquiry from ${name}`;
    const body = `${message}\n\n— ${name}\n${email}`;
    const mailtoLink = `mailto:${contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setTimeout(() => {
      window.location.href = mailtoLink;
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    }, 300);
  };

  return (
    <section id="contact" className="py-24 sm:py-32">
      <div className="container-page grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionLabel index="07">Get in touch</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="section-title mt-6">Let&apos;s build something together</h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="lead mt-6">Companies partner with us on hackathons, talks and hiring. Students and faculty reach out with ideas. Either way, we reply.</p>
            <ul className="mt-10 space-y-5">
              {[
                { icon: Mail, label: contactInfo.email, href: `mailto:${contactInfo.email}` },
                { icon: Phone, label: contactInfo.phone, href: `tel:${contactInfo.phone.replace(/\s/g, '')}` },
                { icon: MapPin, label: contactInfo.address, href: 'https://maps.google.com/?q=BMS+College+of+Engineering+Bengaluru' },
              ].map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="group flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-orange shadow-sm transition-all group-hover:bg-brand-orange group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-ink-soft transition-colors group-hover:text-ink">{label}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={150} className="lg:col-span-6 lg:col-start-7">
          <form onSubmit={send} className="panel p-6 sm:p-9">
            <p className="text-sm font-medium text-ink">What is this about?</p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Enquiry topic">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={topic === t}
                  onClick={() => setTopic(t)}
                  className={cn('rounded-full px-4 py-2 text-sm font-medium transition-all', topic === t ? 'bg-ink text-white' : 'bg-paper text-ink-soft hover:bg-paper-2')}
                >
                  {t}
                </button>
              ))}
            </div>
            <label htmlFor="contact-name" className="field-label mt-7">Your name</label>
            <input id="contact-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" />
            <label htmlFor="contact-email" className="field-label mt-5">Email address</label>
            <input id="contact-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            <label htmlFor="contact-msg" className="field-label mt-5">Message</label>
            <textarea id="contact-msg" className="input min-h-[140px] resize-y" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Tell us a little about what you have in mind." />
            {errorMsg && (
              <p className="mt-3 text-sm text-red-600 flex items-center gap-2" role="alert">
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-lg mt-6 w-full sm:w-auto" disabled={status === 'loading'}>
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening email…
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Email app opened
                </>
              ) : (
                <>
                  Send message <Send className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="mt-3 text-xs text-muted">Opens your email app with the message ready to send.</p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
