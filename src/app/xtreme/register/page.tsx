'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import XtremeStepper from '@/components/xtreme/XtremeStepper';
import { Alert, Field, Input, PageLoader, Select, Spinner } from '@/components/ui/form';
import { getCurrentUser, getLocalProfile, type SessionUser } from '@/lib/auth';
import { isDemoMode, supabase } from '@/lib/supabase';
import {
  getLocalTeamForUser,
  getLocalXtremeProctors,
  saveLocalXtremeTeam,
  type XtremeMember,
  type XtremeTeam,
} from '@/lib/xtreme';

const STEPS = ['Team Info', 'Lead Details', 'Teammates', 'Review & Submit'];

const DEPARTMENTS = [
  'CSE',
  'ISE',
  'AIML',
  'ECE',
  'EEE',
  'MECH',
  'CIVIL',
  'ETE',
  'BioTech',
  'Other',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export default function XtremeRegisterPage() {
  const router = useRouter();

  // Auth & loading
  const [sessionUser, setSessionUser] = useState<SessionUser | null | undefined>(undefined);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Existing team state
  const [existingTeam, setExistingTeam] = useState<XtremeTeam | null>(null);
  const [vtoolsConfirming, setVtoolsConfirming] = useState(false);

  // Form step
  const [step, setStep] = useState(0);

  // Form state
  const [teamName, setTeamName] = useState('');
  const [lead, setLead] = useState<XtremeMember>({
    is_lead: true,
    ieee_member_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    usn: '',
    department: 'CSE',
    year_of_study: '3rd Year',
  });
  const [teammates, setTeammates] = useState<XtremeMember[]>([]);

  // Validation statuses for IEEE IDs
  const [leadValidating, setLeadValidating] = useState(false);
  const [leadValidationResult, setLeadValidationResult] = useState<{
    valid: boolean;
    reason?: string;
  } | null>(null);

  const [teammateValidating, setTeammateValidating] = useState<Record<number, boolean>>({});
  const [teammateValidationResult, setTeammateValidationResult] = useState<
    Record<number, { valid: boolean; reason?: string }>
  >({});

  // Review
  const [certifyAgreed, setCertifyAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function populateForm(t: XtremeTeam) {
    setExistingTeam(t);
    setTeamName(t.team_name);
    const leadMem = t.members.find((m) => m.is_lead);
    const mates = t.members.filter((m) => !m.is_lead);
    if (leadMem) {
      setLead(leadMem);
      setLeadValidationResult({ valid: true });
    }
    if (mates.length > 0) {
      setTeammates(mates);
      const res: Record<number, { valid: boolean }> = {};
      mates.forEach((_, idx) => {
        res[idx] = { valid: true };
      });
      setTeammateValidationResult(res);
    }
  }

  // 1. Initial Load: Check Auth & Existing Team
  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        const u = await getCurrentUser().catch(() => null);
        if (!alive) return;
        setSessionUser(u);

        if (!u) {
          setLoadingInitial(false);
          return;
        }

        // Fetch pre-existing team if any
        if (isDemoMode()) {
          const t = getLocalTeamForUser(u.id);
          if (t && alive) {
            populateForm(t);
          } else {
            // Pre-fill lead info from demo profile
            const prof = getLocalProfile(u.id);
            if (prof && alive) {
              setLead((prev) => ({
                ...prev,
                first_name: prof.first_name || '',
                last_name: prof.last_name || '',
                email: prof.email || u.email,
                phone: prof.phone || '',
                usn: prof.usn || '',
                department: prof.department || 'CSE',
                year_of_study: prof.year_of_study ? `${prof.year_of_study}th Year` : '3rd Year',
                ieee_member_id: prof.ieee_member_id || '',
              }));
            }
          }
        } else {
          // Fetch from Supabase via my-team API or client
          const { data: session } = await supabase.auth.getSession();
          const token = session.session?.access_token;

          if (token) {
            const res = await fetch('/api/xtreme/my-team', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => null);
            if (data?.team && alive) {
              populateForm(data.team);
            } else {
              // Pre-fill from profiles table
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, usn, department, year_of_study, phone, ieee_member_id')
                .eq('id', u.id)
                .maybeSingle();

              if (profile && alive) {
                setLead((prev) => ({
                  ...prev,
                  first_name: profile.first_name || '',
                  last_name: profile.last_name || '',
                  email: u.email,
                  phone: profile.phone || '',
                  usn: profile.usn || '',
                  department: profile.department || 'CSE',
                  year_of_study: profile.year_of_study ? `${profile.year_of_study}th Year` : '3rd Year',
                  ieee_member_id: profile.ieee_member_id || '',
                }));
              }
            }
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (alive) setLoadingInitial(false);
      }
    }

    init();
    return () => {
      alive = false;
    };
  }, []);

  // Live validate IEEE Member Number
  async function validateMemberNumber(id: string, isLeadMember: boolean, teammateIndex?: number) {
    const clean = id.trim();
    if (!clean) return;

    if (isLeadMember) {
      setLeadValidating(true);
      setLeadValidationResult(null);
    } else if (teammateIndex !== undefined) {
      setTeammateValidating((prev) => ({ ...prev, [teammateIndex]: true }));
      setTeammateValidationResult((prev) => {
        const next = { ...prev };
        delete next[teammateIndex];
        return next;
      });
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!isDemoMode()) {
        const { data: session } = await supabase.auth.getSession();
        if (session.session?.access_token) {
          headers['Authorization'] = `Bearer ${session.session.access_token}`;
        }
      }

      const res = await fetch('/api/xtreme/validate-member', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ieee_member_id: clean }),
      });
      const data = await res.json().catch(() => null);

      if (isLeadMember) {
        if (data?.valid) {
          setLeadValidationResult({ valid: true });
          if (data.firstName && !lead.first_name) {
            setLead((prev) => ({
              ...prev,
              first_name: data.firstName || prev.first_name,
            }));
          }
        } else {
          setLeadValidationResult({
            valid: false,
            reason: data?.reason || 'Member ID not recognized as an active BMSCE member.',
          });
        }
      } else if (teammateIndex !== undefined) {
        if (data?.valid) {
          setTeammateValidationResult((prev) => ({ ...prev, [teammateIndex]: { valid: true } }));
          if (data.firstName) {
            setTeammates((prev) => {
              const copy = [...prev];
              copy[teammateIndex] = {
                ...copy[teammateIndex],
                first_name: data.firstName || copy[teammateIndex].first_name,
              };
              return copy;
            });
          }
        } else {
          setTeammateValidationResult((prev) => ({
            ...prev,
            [teammateIndex]: {
              valid: false,
              reason: data?.reason || 'Member ID not recognized as an active BMSCE member.',
            },
          }));
        }
      }
    } catch {
      if (isLeadMember) {
        setLeadValidationResult({ valid: false, reason: 'Validation request failed.' });
      } else if (teammateIndex !== undefined) {
        setTeammateValidationResult((prev) => ({
          ...prev,
          [teammateIndex]: { valid: false, reason: 'Validation request failed.' },
        }));
      }
    } finally {
      if (isLeadMember) setLeadValidating(false);
      else if (teammateIndex !== undefined) {
        setTeammateValidating((prev) => ({ ...prev, [teammateIndex]: false }));
      }
    }
  }

  // Teammate handlers
  function addTeammate() {
    if (teammates.length >= 2) return;
    setTeammates((prev) => [
      ...prev,
      {
        is_lead: false,
        ieee_member_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        usn: '',
        department: 'CSE',
        year_of_study: '3rd Year',
      },
    ]);
  }

  function removeTeammate(index: number) {
    setTeammates((prev) => prev.filter((_, i) => i !== index));
    setTeammateValidationResult((prev) => {
      const next: Record<number, { valid: boolean; reason?: string }> = {};
      Object.keys(prev).forEach((k) => {
        const i = Number(k);
        if (i < index) next[i] = prev[i];
        else if (i > index) next[i - 1] = prev[i];
      });
      return next;
    });
  }

  function updateTeammateField(index: number, field: keyof XtremeMember, val: string) {
    setTeammates((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  // Step Navigations & Validation
  function nextStep() {
    setFormError('');

    if (step === 0) {
      const cleanName = teamName.trim();
      if (!cleanName) {
        setFormError('Please enter a team name.');
        return;
      }
      if (!/^[a-zA-Z0-9]{3,20}$/.test(cleanName)) {
        setFormError(
          'Team name must be 3–20 characters and contain only letters and numbers (no spaces or symbols).'
        );
        return;
      }
    } else if (step === 1) {
      if (!lead.ieee_member_id.trim()) {
        setFormError('IEEE Member Number is required.');
        return;
      }
      if (!lead.first_name.trim() || !lead.email.trim() || !lead.phone?.trim() || !lead.usn?.trim()) {
        setFormError('Please fill in all required fields for the Team Lead.');
        return;
      }
      if (leadValidationResult && !leadValidationResult.valid) {
        setFormError('Please provide a valid, active BMSCE IEEE Member Number.');
        return;
      }
    } else if (step === 2) {
      for (let i = 0; i < teammates.length; i++) {
        const tm = teammates[i];
        if (!tm.ieee_member_id.trim() || !tm.first_name.trim() || !tm.email.trim() || !tm.usn?.trim()) {
          setFormError(`Please complete all details for Teammate #${i + 1}.`);
          return;
        }
        if (tm.ieee_member_id.trim() === lead.ieee_member_id.trim()) {
          setFormError(`Teammate #${i + 1} cannot have the same Member ID as the Team Lead.`);
          return;
        }
      }
      if (teammates.length === 2 && teammates[0].ieee_member_id.trim() === teammates[1].ieee_member_id.trim()) {
        setFormError('Teammates cannot have identical Member IDs.');
        return;
      }
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setFormError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  // Final Submission
  async function handleSubmit() {
    if (!certifyAgreed) {
      setFormError('Please confirm the declaration checkbox before submitting.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const payload = {
      teamName: teamName.trim(),
      members: [lead, ...teammates],
    };

    try {
      if (isDemoMode()) {
        let proctorId = existingTeam?.proctor_id || null;
        let proctorName = existingTeam?.proctor_name || '';
        let proctorIeee = existingTeam?.proctor_ieee_id || '';

        if (!proctorName) {
          const proctors = getLocalXtremeProctors();
          const available = proctors.find((p) => (p.assigned_count ?? 0) < 20);
          if (available) {
            proctorId = available.id;
            proctorName = available.name;
            proctorIeee = available.ieee_id;
          }
        }

        const demoTeam: XtremeTeam = {
          id: existingTeam?.id || `demo-team-${Date.now()}`,
          team_name: payload.teamName,
          lead_user_id: sessionUser?.id || 'demo-usr-lead',
          leader_email: lead.email,
          proctor_id: proctorId,
          vtools_verified: existingTeam?.vtools_verified || false,
          proctor_name: proctorName,
          proctor_ieee_id: proctorIeee,
          created_at: existingTeam?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          members: payload.members.map((m, i) => ({
            ...m,
            id: `demo-mem-${i}-${Date.now()}`,
          })),
        };
        saveLocalXtremeTeam(demoTeam);
        router.push(`/xtreme/team`);
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error('Session expired. Please sign in again.');

      const res = await fetch('/api/xtreme/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(result?.error || 'Registration failed. Please try again.');
      }

      router.push(`/xtreme/success?teamId=${result.teamId}&teamName=${encodeURIComponent(result.teamName || teamName)}`);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to submit registration.');
      setSubmitting(false);
    }
  }

  // Confirm vTools Registration Handler
  async function confirmVtoolsRegistration() {
    setVtoolsConfirming(true);
    try {
      if (isDemoMode()) {
        if (existingTeam) {
          saveLocalXtremeTeam({ ...existingTeam, vtools_verified: true });
          setExistingTeam((prev) => (prev ? { ...prev, vtools_verified: true } : null));
        }
      } else {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        const res = await fetch('/api/xtreme/verify-vtools', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          throw new Error(d?.error || 'Could not verify vTools status.');
        }
        setExistingTeam((prev) => (prev ? { ...prev, vtools_verified: true } : null));
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update vTools confirmation.');
    } finally {
      setVtoolsConfirming(false);
    }
  }

  if (loadingInitial) {
    return <PageLoader />;
  }

  // Auth gate check
  if (!sessionUser) {
    return (
      <div className="mx-auto max-w-lg text-center py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-navy text-white shadow-lg">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="display mt-6 text-3xl text-ink">Sign In Required</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Under the <strong>Lead-Delegated Registration Model</strong>, only the Team Lead logs in. If you are the Team Lead, please sign in with your BMSCE student account to register your team.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login?next=%2Fxtreme%2Fregister" className="btn btn-primary btn-lg">
            Sign In as Team Lead <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/membership/register" className="btn btn-ghost btn-lg bg-white">
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  // Locked View if already vTools verified
  if (existingTeam && existingTeam.vtools_verified) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Check className="h-6 w-6" strokeWidth={3} />
            </div>
            <div>
              <span className="badge bg-emerald-100 text-emerald-800">Registration Locked</span>
              <h2 className="mt-2 text-2xl font-bold text-ink">
                Team {existingTeam.team_name} is Confirmed!
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Official registration on IEEE vTools has been marked as complete. Your team is officially cleared for IEEEXtreme 20.0.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 rounded-2xl bg-white p-5 border border-line">
            <div className="flex justify-between items-center text-sm border-b border-line pb-3">
              <span className="text-muted">Assigned Proctor</span>
              <span className="font-semibold text-ink">
                {existingTeam.proctor_name
                  ? `${existingTeam.proctor_name} (${existingTeam.proctor_ieee_id || 'ID Verified'})`
                  : 'Assigned on campus'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-line pb-3">
              <span className="text-muted">Team Members ({existingTeam.members.length})</span>
              <span className="font-semibold text-ink">
                {existingTeam.members.map((m) => m.first_name).join(', ')}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Official Portal</span>
              <a
                href="https://xtreme.vtools.ieee.org/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-brand-orange hover:underline"
              >
                IEEE vTools Xtreme <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Link href="/xtreme" className="link-arrow">
              ← Return to IEEEXtreme Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Existing team notification if updating */}
      {existingTeam && (
        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand-navy shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-navy">
                Active Registration: Team {existingTeam.team_name}
              </p>
              <p className="text-xs text-ink-soft">
                You can edit your members below until you complete official vTools registration.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={confirmVtoolsRegistration}
            disabled={vtoolsConfirming}
            className="mt-3 sm:mt-0 btn btn-sm bg-brand-navy text-white text-xs whitespace-nowrap"
          >
            {vtoolsConfirming ? <Spinner className="h-3 w-3" /> : 'Confirm vTools Done'}
          </button>
        </div>
      )}

      {/* Stepper Header */}
      <div className="mb-10 text-center">
        <span className="badge bg-brand-orange/15 text-brand-orange mb-2">
          IEEEXtreme 20.0
        </span>
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Team Registration</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Complete the 4 steps below to register your squad on the BMSCE gateway.
        </p>
      </div>

      <XtremeStepper currentStep={step} steps={STEPS} />

      {/* Form Error Banner */}
      {formError && (
        <Alert tone="error" className="mt-6">
          {formError}
        </Alert>
      )}

      {/* Step Panels */}
      <div className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-xl sm:p-10">
        <AnimatePresence mode="wait">
          {/* STEP 0: TEAM INFO */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-orange" />
                  <span>Choose Your Team Name</span>
                </h2>
                <p className="text-xs text-muted mt-1">
                  This will be your official moniker on both the BMSCE portal and global IEEE vTools leaderboard.
                </p>
              </div>

              <Field
                label="Team Name"
                htmlFor="team_name"
                required
                hint="3 to 20 characters. Letters and numbers only — no spaces or special symbols."
              >
                <Input
                  id="team_name"
                  placeholder="e.g. BitShifters20"
                  value={teamName}
                  maxLength={20}
                  onChange={(e) => setTeamName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                />
              </Field>

              <div className="rounded-2xl bg-paper p-4 text-xs text-ink-soft space-y-1.5">
                <p className="font-semibold text-ink">Important Note:</p>
                <p>• Team names must be unique across all participating teams.</p>
                <p>• Use the exact same team name when you later register on https://xtreme.vtools.ieee.org/.</p>
              </div>
            </motion.div>
          )}

          {/* STEP 1: LEAD DETAILS */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                  <User className="h-5 w-5 text-brand-orange" />
                  <span>Team Administrator / Lead</span>
                </h2>
                <p className="text-xs text-muted mt-1">
                  As Team Lead, you represent the squad and receive proctor & competition updates.
                </p>
              </div>

              {/* IEEE Member Number verification */}
              <div className="rounded-2xl border border-line bg-paper/60 p-4">
                <Field
                  label="IEEE Member Number"
                  htmlFor="lead_ieee"
                  required
                  hint="Must be an active IEEE membership number."
                >
                  <div className="flex gap-2">
                    <Input
                      id="lead_ieee"
                      placeholder="e.g. 100650078"
                      value={lead.ieee_member_id}
                      onChange={(e) => {
                        setLead({ ...lead, ieee_member_id: e.target.value });
                        setLeadValidationResult(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => validateMemberNumber(lead.ieee_member_id, true)}
                      disabled={leadValidating || !lead.ieee_member_id.trim()}
                      className="btn btn-ghost bg-white shrink-0 text-xs px-4"
                    >
                      {leadValidating ? <Spinner className="h-4 w-4" /> : 'Verify'}
                    </button>
                  </div>
                </Field>

                {leadValidationResult && (
                  <div className="mt-2 text-xs">
                    {leadValidationResult.valid ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <Check className="h-3.5 w-3.5" /> Verified BMSCE IEEE Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {leadValidationResult.reason}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First Name" htmlFor="lead_fname" required>
                  <Input
                    id="lead_fname"
                    value={lead.first_name}
                    onChange={(e) => setLead({ ...lead, first_name: e.target.value })}
                  />
                </Field>

                <Field label="Last Name" htmlFor="lead_lname">
                  <Input
                    id="lead_lname"
                    value={lead.last_name || ''}
                    onChange={(e) => setLead({ ...lead, last_name: e.target.value })}
                  />
                </Field>

                <Field label="Email (Associated with IEEE)" htmlFor="lead_email" required>
                  <Input
                    id="lead_email"
                    type="email"
                    value={lead.email}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  />
                </Field>

                <Field label="Phone / WhatsApp" htmlFor="lead_phone" required>
                  <Input
                    id="lead_phone"
                    placeholder="+91 9876543210"
                    value={lead.phone || ''}
                    onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  />
                </Field>

                <Field label="College USN" htmlFor="lead_usn" required>
                  <Input
                    id="lead_usn"
                    placeholder="1BM23CS..."
                    value={lead.usn || ''}
                    onChange={(e) => setLead({ ...lead, usn: e.target.value.toUpperCase() })}
                  />
                </Field>

                <Field label="Department" htmlFor="lead_dept" required>
                  <Select
                    id="lead_dept"
                    value={lead.department || 'CSE'}
                    onChange={(e) => setLead({ ...lead, department: e.target.value })}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Year of Study" htmlFor="lead_year" required className="sm:col-span-2">
                  <Select
                    id="lead_year"
                    value={lead.year_of_study || '3rd Year'}
                    onChange={(e) => setLead({ ...lead, year_of_study: e.target.value })}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </motion.div>
          )}

          {/* STEP 2: TEAMMATES */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-orange" />
                    <span>Teammates ({teammates.length}/2)</span>
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Total team size: {teammates.length + 1} of 3 (Lead + up to 2 teammates).
                  </p>
                </div>

                {teammates.length < 2 && (
                  <button
                    type="button"
                    onClick={addTeammate}
                    className="btn btn-ghost bg-paper border border-line text-xs font-semibold self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4" /> Add Teammate
                  </button>
                )}
              </div>

              {teammates.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-line bg-paper/40 p-8 text-center">
                  <User className="mx-auto h-8 w-8 text-muted" />
                  <p className="mt-2 text-sm font-semibold text-ink">Competing Solo?</p>
                  <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                    Solo participation is fully permitted! You can proceed to the next step, or click &quot;Add Teammate&quot; to bring up to two BMSCE classmates.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {teammates.map((tm, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-line bg-paper/40 p-5 relative transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="badge bg-brand-navy text-white text-xs">
                          Teammate #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTeammate(idx)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Member ID validation */}
                        <Field
                          label="IEEE Member Number"
                          htmlFor={`tm_ieee_${idx}`}
                          required
                          hint="Must be an active IEEE membership number."
                        >
                          <div className="flex gap-2">
                            <Input
                              id={`tm_ieee_${idx}`}
                              placeholder="e.g. 98451201"
                              value={tm.ieee_member_id}
                              onChange={(e) => {
                                updateTeammateField(idx, 'ieee_member_id', e.target.value);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => validateMemberNumber(tm.ieee_member_id, false, idx)}
                              disabled={teammateValidating[idx] || !tm.ieee_member_id.trim()}
                              className="btn btn-ghost bg-white shrink-0 text-xs px-4"
                            >
                              {teammateValidating[idx] ? <Spinner className="h-4 w-4" /> : 'Verify'}
                            </button>
                          </div>
                        </Field>

                        {teammateValidationResult[idx] && (
                          <div className="text-xs">
                            {teammateValidationResult[idx].valid ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                <Check className="h-3.5 w-3.5" /> Verified BMSCE IEEE Member
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {teammateValidationResult[idx].reason}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="First Name" htmlFor={`tm_fname_${idx}`} required>
                            <Input
                              id={`tm_fname_${idx}`}
                              value={tm.first_name}
                              onChange={(e) => updateTeammateField(idx, 'first_name', e.target.value)}
                            />
                          </Field>

                          <Field label="Last Name" htmlFor={`tm_lname_${idx}`}>
                            <Input
                              id={`tm_lname_${idx}`}
                              value={tm.last_name || ''}
                              onChange={(e) => updateTeammateField(idx, 'last_name', e.target.value)}
                            />
                          </Field>

                          <Field label="Email (Associated with IEEE)" htmlFor={`tm_email_${idx}`} required>
                            <Input
                              id={`tm_email_${idx}`}
                              type="email"
                              value={tm.email}
                              onChange={(e) => updateTeammateField(idx, 'email', e.target.value)}
                            />
                          </Field>

                          <Field label="Phone / WhatsApp" htmlFor={`tm_phone_${idx}`}>
                            <Input
                              id={`tm_phone_${idx}`}
                              value={tm.phone || ''}
                              onChange={(e) => updateTeammateField(idx, 'phone', e.target.value)}
                            />
                          </Field>

                          <Field label="USN" htmlFor={`tm_usn_${idx}`} required>
                            <Input
                              id={`tm_usn_${idx}`}
                              value={tm.usn || ''}
                              onChange={(e) => updateTeammateField(idx, 'usn', e.target.value.toUpperCase())}
                            />
                          </Field>

                          <Field label="Department" htmlFor={`tm_dept_${idx}`} required>
                            <Select
                              id={`tm_dept_${idx}`}
                              value={tm.department || 'CSE'}
                              onChange={(e) => updateTeammateField(idx, 'department', e.target.value)}
                            >
                              {DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </Select>
                          </Field>

                          <Field label="Year of Study" htmlFor={`tm_year_${idx}`} required className="sm:col-span-2">
                            <Select
                              id={`tm_year_${idx}`}
                              value={tm.year_of_study || '3rd Year'}
                              onChange={(e) => updateTeammateField(idx, 'year_of_study', e.target.value)}
                            >
                              {YEARS.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </Select>
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: REVIEW & SUBMIT */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-orange" />
                  <span>Review Team Registration</span>
                </h2>
                <p className="text-xs text-muted mt-1">
                  Check all details before submitting to the BMSCE IEEE gateway.
                </p>
              </div>

              {/* Summary Card */}
              <div className="rounded-2xl border border-line bg-paper/40 p-5 space-y-4">
                <div className="border-b border-line pb-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-muted uppercase">Team Name</span>
                    <p className="text-lg font-extrabold text-ink">{teamName}</p>
                  </div>
                  <span className="badge bg-brand-orange/20 text-brand-orange font-bold">
                    {teammates.length + 1} Member{teammates.length > 0 ? 's' : ''}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-muted uppercase">Team Lead</span>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-ink">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-xs text-muted">
                        IEEE ID: {lead.ieee_member_id} · {lead.usn} ({lead.department})
                      </p>
                    </div>
                    <span className="text-xs text-ink-soft">{lead.email}</span>
                  </div>
                </div>

                {teammates.length > 0 && (
                  <div className="border-t border-line pt-3 space-y-2">
                    <span className="text-xs font-semibold text-muted uppercase">Teammates</span>
                    {teammates.map((tm, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-ink">
                            {tm.first_name} {tm.last_name}
                          </p>
                          <p className="text-xs text-muted">
                            IEEE ID: {tm.ieee_member_id} · {tm.usn} ({tm.department})
                          </p>
                        </div>
                        <span className="text-xs text-ink-soft">{tm.email}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-line pt-3 text-xs text-ink-soft">
                  <p className="font-semibold text-brand-navy">Next Step After Submission:</p>
                  <p className="mt-0.5">
                    You will be assigned an authorized BMSCE faculty proctor. Once assigned, you will register on the official IEEE vTools platform (`https://xtreme.vtools.ieee.org/`) and confirm it here.
                  </p>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 cursor-pointer hover:bg-paper/40 transition">
                <input
                  type="checkbox"
                  checked={certifyAgreed}
                  onChange={(e) => setCertifyAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-brand-orange focus:ring-brand-orange"
                />
                <span className="text-xs leading-relaxed text-ink-soft">
                  I certify that all registered team members are active IEEE members and currently enrolled students at B.M.S. College of Engineering. I understand that the lead must confirm final registration on official IEEE vTools once a proctor is assigned.
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={submitting}
              className="btn btn-ghost text-xs"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <Link href="/xtreme" className="btn btn-ghost text-xs">
              Cancel
            </Link>
          )}

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={nextStep} className="btn btn-primary text-xs font-bold">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !certifyAgreed}
              className="btn btn-primary btn-lg shadow-xl"
            >
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" /> Submitting...
                </>
              ) : (
                <>
                  Submit Team Registration <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

