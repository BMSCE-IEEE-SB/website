'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, CheckCircle, ExternalLink, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { confetti } from '@/lib/confetti';
import { isDemoMode, supabase } from '@/lib/supabase';
import { getLocalTeamForUser, saveLocalXtremeTeam } from '@/lib/xtreme';
import { getCurrentUser } from '@/lib/auth';
import { Spinner } from '@/components/ui/form';

function SuccessContent() {
  const searchParams = useSearchParams();
  const teamNameParam = searchParams.get('teamName') || 'Your Team';

  const [vtoolsConfirmed, setVtoolsConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proctorName, setProctorName] = useState<string | null>(null);
  const [proctorIeee, setProctorIeee] = useState<string | null>(null);

  useEffect(() => {
    confetti();

    // Check team details
    async function loadTeam() {
      const u = await getCurrentUser().catch(() => null);
      if (!u) return;

      if (isDemoMode()) {
        const t = getLocalTeamForUser(u.id);
        if (t) {
          setVtoolsConfirmed(t.vtools_verified);
          setProctorName(t.proctor_name || null);
          setProctorIeee(t.proctor_ieee_id || null);
        }
      } else {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (token) {
          const res = await fetch('/api/xtreme/my-team', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = await res.json().catch(() => null);
          if (d?.team) {
            setVtoolsConfirmed(d.team.vtools_verified);
            setProctorName(d.team.proctor_name || null);
            setProctorIeee(d.team.proctor_ieee_id || null);
          }
        }
      }
    }

    loadTeam();
  }, []);

  async function handleConfirmVtools() {
    setConfirming(true);
    try {
      if (isDemoMode()) {
        const u = await getCurrentUser().catch(() => null);
        if (u) {
          const t = getLocalTeamForUser(u.id);
          if (t) saveLocalXtremeTeam({ ...t, vtools_verified: true });
        }
        setVtoolsConfirmed(true);
      } else {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch('/api/xtreme/verify-vtools', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || 'Verification failed.');
        }
        setVtoolsConfirmed(true);
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to record confirmation.');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8 text-center sm:py-14">
      {/* Celebration Icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl ring-8 ring-emerald-100">
        <Check className="h-10 w-10" strokeWidth={3} />
      </div>

      <span className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800">
        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
        Gateway Registration Complete
      </span>

      <h1 className="display mt-4 text-3xl text-ink sm:text-5xl">
        Team <span className="text-brand-orange">{teamNameParam}</span> Registered!
      </h1>

      <p className="lead mx-auto mt-4 max-w-lg text-ink-soft">
        Your squad is officially registered on the BMSCE IEEEXtreme 20.0 gateway. Here is what you need to do next.
      </p>

      {/* Two-part roadmap card */}
      <div className="mt-10 rounded-3xl border border-line bg-white p-6 text-left shadow-xl sm:p-8 space-y-6">
        {/* Step 1 Status */}
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Step 1: BMSCE Gateway Registration</h3>
            <p className="text-xs text-muted mt-0.5">
              Team details and BMSCE IEEE membership status have been saved in our branch database.
            </p>
          </div>
        </div>

        {/* Proctor Status Sub-card */}
        <div className="rounded-2xl border border-brand-sky/30 bg-sky-50/60 p-4">
          <div className="flex items-center gap-2 text-brand-navy font-bold text-sm">
            <UserCheck className="h-4 w-4" />
            <span>Assigned Proctor</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {proctorName ? (
              <span className="font-semibold text-emerald-800">
                {proctorName} {proctorIeee ? `(IEEE ID: ${proctorIeee})` : ''}
              </span>
            ) : (
              'The executive committee is currently assigning a certified Proctor to your team. Check back here or in your team portal shortly.'
            )}
          </p>
        </div>

        <hr className="border-line" />

        {/* Step 2 Status */}
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white font-bold text-sm">
            2
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">
                Step 2: Official IEEE vTools Registration
              </h3>
              {vtoolsConfirmed && (
                <span className="badge bg-emerald-100 text-emerald-800 font-semibold text-xs">
                  Confirmed & Locked
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              As Team Lead, navigate to the official global IEEE portal and register the team using your assigned proctor number.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <a
                href="https://xtreme.vtools.ieee.org/"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost bg-paper border border-line text-xs font-semibold inline-flex items-center gap-1.5"
              >
                Open Official IEEE vTools <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {!vtoolsConfirmed ? (
                <button
                  type="button"
                  onClick={handleConfirmVtools}
                  disabled={confirming}
                  className="btn btn-primary text-xs font-bold inline-flex items-center gap-1.5"
                >
                  {confirming ? (
                    <>
                      <Spinner className="h-3 w-3" /> Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> I Have Completed vTools Registration
                    </>
                  )}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> vTools Registration Completed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <Link href="/xtreme" className="btn btn-ghost text-xs">
          ← Return to IEEEXtreme Home
        </Link>
        <Link href="/xtreme/register" className="btn btn-light border border-line text-xs font-semibold">
          View / Edit Team Portal
        </Link>
      </div>
    </div>
  );
}

export default function XtremeSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted">Loading confirmation...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

