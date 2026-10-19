'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Phone } from 'lucide-react';
import {
  XTREME_AMBASSADOR_ID,
  XTREME_SUPPORT_CONTACTS,
  XTREME_VTOOLS_URL,
} from '@/lib/xtreme';
import { cn } from '@/lib/utils';

const steps = [
  'Open the IEEE Xtreme portal using the button below.',
  "Click on 'Team Registration'.",
  "Select 'Sign In' and sign in with your IEEE ID and password. Make sure you are logged into your IEEE account.",
  "Select 'Teams'.",
  'Enter your team name — exactly the same name you registered on this gateway.',
  'Add your experience (e.g. Batch of 2030 – 1 year, Batch of 2029 – 2 years).',
  "Click 'Add Member' and add each teammate's Membership ID, experience and Ambassador ID (only for teams of 2–3).",
  'Enter the Proctor Membership ID shown on your Team Dashboard here.',
  'Submit your details on the portal.',
  'Come back here and confirm with the vTools confirmation button so your squad is marked complete.',
];

const notes = [
  'An active IEEE student membership is required for every teammate.',
  'Use your IEEE-registered email consistently on both portals.',
  'Complete this BMSCE gateway registration first, then the vTools portal entry.',
  'Proctor details for your squad live on your Team Dashboard — no separate sheet needed.',
];

export default function VtoolsInstructions({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copyAmbassadorId() {
    try {
      await navigator.clipboard.writeText(XTREME_AMBASSADOR_ID);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = XTREME_AMBASSADOR_ID;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn('space-y-6', compact && 'space-y-5 text-left')}>
      {/* Ambassador ID — priority display */}
      <div className="rounded-3xl bg-ink p-6 text-white sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-orange">
          Priority · Referring Ambassador ID
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xl font-extrabold tracking-wide sm:text-2xl">
            {XTREME_AMBASSADOR_ID}
          </p>
          <button
            type="button"
            onClick={copyAmbassadorId}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy ID
              </>
            )}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/70">
          Enter this ID for every member while registering on the vTools portal. Without it your team
          won&apos;t be counted under the BMSCE ambassador.
        </p>
        <a
          href={XTREME_VTOOLS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-5 text-xs font-bold"
        >
          Open IEEEXtreme Portal <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Steps */}
      <div>
        <h3 className={cn('font-bold text-ink', compact ? 'text-base' : 'text-lg')}>
          Steps for Single & Team Registrations
        </h3>
        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Important notes */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Please follow carefully</p>
        <ul className="mt-3 space-y-2">
          {notes.map((n) => (
            <li key={n} className="flex items-start gap-2 text-xs leading-relaxed text-amber-900 sm:text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              {n}
            </li>
          ))}
        </ul>
      </div>

      {/* Helpdesk */}
      <div className="flex flex-col gap-2 rounded-2xl bg-paper p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-ink">Queries? Contact the Xtreme helpdesk</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {XTREME_SUPPORT_CONTACTS.map((c) => (
            <a
              key={c.phone}
              href={c.tel}
              className="inline-flex items-center gap-1.5 font-semibold text-brand-navy hover:text-brand-orange"
            >
              <Phone className="h-3.5 w-3.5" />
              {c.name}: {c.phone}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
