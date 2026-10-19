'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  Info,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';
import { Alert, PageLoader, Spinner } from '@/components/ui/form';
import { getCurrentUser, type SessionUser } from '@/lib/auth';
import { isDemoMode, supabase } from '@/lib/supabase';
import { getLocalTeamForUser, saveLocalXtremeTeam, type XtremeTeam } from '@/lib/xtreme';

export default function XtremeTeamPage() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null | undefined>(undefined);
  const [team, setTeam] = useState<XtremeTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // vTools confirmation state
  const [confirmingVtools, setConfirmingVtools] = useState(false);
  const [vtoolsError, setVtoolsError] = useState('');
  const [vtoolsSuccess, setVtoolsSuccess] = useState('');

  useEffect(() => {
    let alive = true;

    async function fetchTeam() {
      setLoading(true);
      setError('');
      try {
        const u = await getCurrentUser().catch(() => null);
        if (!alive) return;
        setSessionUser(u);

        if (!u) {
          setLoading(false);
          return;
        }

        if (isDemoMode()) {
          const t = getLocalTeamForUser(u.id, u.email);
          if (alive) {
            setTeam(t);
            setLoading(false);
          }
          return;
        }

        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) {
          if (alive) setLoading(false);
          return;
        }

        const res = await fetch('/api/xtreme/my-team', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load team details.');
        }

        if (alive) {
          setTeam(data?.team || null);
        }
      } catch (err: unknown) {
        if (alive) {
          setError((err as Error).message || 'Could not load your team.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchTeam();
    return () => {
      alive = false;
    };
  }, []);

  async function handleConfirmVtools() {
    if (!team) return;
    setConfirmingVtools(true);
    setVtoolsError('');
    setVtoolsSuccess('');

    try {
      if (isDemoMode()) {
        const updatedTeam = { ...team, vtools_verified: true, updated_at: new Date().toISOString() };
        saveLocalXtremeTeam(updatedTeam);
        setTeam(updatedTeam);
        setVtoolsSuccess('Official IEEE vTools registration confirmed. Team registration is now locked.');
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error('Session expired. Please sign in again.');

      const res = await fetch('/api/xtreme/verify-vtools', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Verification failed. Please try again.');
      }

      setTeam((prev) => (prev ? { ...prev, vtools_verified: true } : prev));
      setVtoolsSuccess(data?.message || 'Official IEEE vTools registration confirmed.');
    } catch (err: unknown) {
      setVtoolsError((err as Error).message || 'Failed to record vTools confirmation.');
    } finally {
      setConfirmingVtools(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  // Not signed in state
  if (!sessionUser) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="panel p-8 sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange/15 text-brand-orange">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="display mt-4 text-2xl text-ink">Sign in to Access Your Squad</h1>
          <p className="mt-2 text-xs text-ink-soft leading-relaxed">
            Please log in with the verified email address associated with your team registration or leadership assignment.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login" className="btn btn-primary w-full text-xs font-bold">
              Sign In to Your Account
            </Link>
            <Link href="/ieeextreme" className="btn btn-ghost text-xs text-muted">
              ← Return to IEEEXtreme Gateway
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No team found state
  if (!team) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="panel p-8 sm:p-10 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-paper text-muted">
            <Trophy className="h-7 w-7 text-muted/60" />
          </div>
          <h1 className="display text-2xl text-ink">No Registered Team Found</h1>
          <p className="text-xs text-ink-soft max-w-md mx-auto leading-relaxed">
            We could not find an IEEEXtreme 20.0 squad linked to{' '}
            <span className="font-semibold text-ink">{sessionUser.email}</span>.
            If your team was created by the organizers, please ensure you are signed in with the exact leader email provided.
          </p>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/ieeextreme/register" className="btn btn-primary text-xs font-bold">
              Register a New Team
            </Link>
            <Link href="/ieeextreme" className="btn btn-ghost text-xs border border-line">
              Back to IEEEXtreme
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const leadMember = team.members.find((m) => m.is_lead);
  const otherMembers = team.members.filter((m) => !m.is_lead);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/ieeextreme"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to IEEEXtreme Portal
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="display text-3xl font-extrabold text-ink tracking-tight">
              Team <span className="text-brand-orange">{team.team_name}</span>
            </h1>
            {team.vtools_verified ? (
              <span className="badge bg-emerald-50 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5" strokeWidth={3} /> vTools Verified & Locked
              </span>
            ) : (
              <span className="badge bg-amber-50 text-amber-800 text-xs font-semibold">
                Pending vTools Confirmation
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Registered on {new Date(team.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!team.vtools_verified && (
            <Link
              href="/ieeextreme/register"
              className="btn btn-ghost bg-white border border-line text-xs font-semibold"
            >
              Edit Team Members
            </Link>
          )}
        </div>
      </div>

      {vtoolsError && <Alert tone="error">{vtoolsError}</Alert>}
      {vtoolsSuccess && <Alert tone="success">{vtoolsSuccess}</Alert>}

      {/* Grid: Proctor Details & vTools Action */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ASSIGNED PROCTOR CARD */}
        <div className="rounded-3xl border border-brand-sky/40 bg-sky-50/50 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 font-bold text-base text-brand-navy">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-sky/20 text-brand-navy">
              <UserCheck className="h-4 w-4" />
            </div>
            <span>Official Faculty Proctor</span>
          </div>

          {team.proctor_name?.trim() ? (
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/90 p-4 border border-brand-sky/20">
                <p className="text-[11px] uppercase tracking-wider text-muted font-bold">Proctor Name</p>
                <p className="text-lg font-bold text-ink mt-0.5">{team.proctor_name}</p>

                {team.proctor_ieee_id && (
                  <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted font-bold">IEEE Member Number</p>
                      <p className="font-mono text-sm font-bold text-brand-navy mt-0.5">
                        {team.proctor_ieee_id}
                      </p>
                    </div>
                    <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                      Authorized Proctor
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-ink-soft leading-relaxed">
                <Info className="h-4 w-4 shrink-0 text-brand-sky mt-0.5" />
                <span>
                  Use this Proctor IEEE ID when completing your squad registration on the global IEEE vTools portal.
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/80 p-5 border border-amber-200 space-y-2 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <p className="font-bold text-xs text-ink">Proctor Assignment in Progress</p>
              <p className="text-[11px] text-muted leading-relaxed">
                The BMSCE Student Branch executive committee is assigning an authorized faculty proctor to your squad. Check back shortly.
              </p>
            </div>
          )}
        </div>

        {/* VTOOLS REGISTRATION STATUS CARD */}
        <div className="rounded-3xl border border-line bg-white p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 font-bold text-base text-ink">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span>Global IEEE vTools Status</span>
            </div>

            <p className="mt-3 text-xs text-ink-soft leading-relaxed">
              Every team must register on the global competition platform. Once you submit on vTools using your proctor ID, confirm below to finalize and lock your team.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href="https://xtreme.vtools.ieee.org/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost w-full bg-paper border border-line text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              Open Official IEEE vTools <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {!team.vtools_verified ? (
              <button
                type="button"
                onClick={handleConfirmVtools}
                disabled={confirmingVtools}
                className="btn btn-primary w-full text-xs font-bold inline-flex items-center justify-center gap-2"
              >
                {confirmingVtools ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" /> Confirming...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Confirm vTools Registration
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
                <p className="text-xs font-bold text-emerald-800 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Official vTools Registration Confirmed
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Your registration is confirmed. Team roster and details are now locked for campus lab coordination.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TEAM ROSTER */}
      <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-orange" />
            <h2 className="text-lg font-bold text-ink">Team Roster ({team.members.length} / 3)</h2>
          </div>
          <span className="text-xs text-muted">All active BMSCE IEEE members</span>
        </div>

        <div className="space-y-4">
          {/* Lead Card */}
          {leadMember && (
            <div className="rounded-2xl border-2 border-brand-navy/20 bg-brand-navy/[0.02] p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-brand-navy text-white text-[10px] uppercase font-bold py-0.5 px-2">
                      Team Lead
                    </span>
                    <h3 className="font-bold text-base text-ink">
                      {leadMember.first_name} {leadMember.last_name}
                    </h3>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>IEEE ID: <strong className="text-ink font-mono">{leadMember.ieee_member_id}</strong></span>
                    {leadMember.usn && <span>USN: <strong className="text-ink">{leadMember.usn}</strong></span>}
                    {leadMember.department && <span>Dept: {leadMember.department}</span>}
                    {leadMember.year_of_study && <span>({leadMember.year_of_study})</span>}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-ink-soft sm:text-right">
                  {leadMember.email && (
                    <div className="flex sm:justify-end items-center gap-1.5">
                      <Mail className="h-3 w-3 text-muted" /> {leadMember.email}
                    </div>
                  )}
                  {leadMember.phone && (
                    <div className="flex sm:justify-end items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted" /> {leadMember.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Teammates */}
          {otherMembers.map((m, idx) => (
            <div key={idx} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-paper text-muted text-[10px] uppercase font-semibold py-0.5 px-2">
                      Teammate {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-ink">
                      {m.first_name} {m.last_name}
                    </h3>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>IEEE ID: <strong className="text-ink font-mono">{m.ieee_member_id}</strong></span>
                    {m.usn && <span>USN: <strong className="text-ink">{m.usn}</strong></span>}
                    {m.department && <span>Dept: {m.department}</span>}
                    {m.year_of_study && <span>({m.year_of_study})</span>}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-ink-soft sm:text-right">
                  {m.email && (
                    <div className="flex sm:justify-end items-center gap-1.5">
                      <Mail className="h-3 w-3 text-muted" /> {m.email}
                    </div>
                  )}
                  {m.phone && (
                    <div className="flex sm:justify-end items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted" /> {m.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

