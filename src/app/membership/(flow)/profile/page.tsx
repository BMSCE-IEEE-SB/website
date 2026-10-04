'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Hash, Phone, User } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import { getCurrentUser, getLocalProfile, hasPaidCookie, hasUserSubmittedPayment, saveLocalProfile, type SessionUser, type UserProfile } from '@/lib/auth';
import { Alert, Field, Input, PageLoader, Select, Spinner } from '@/components/ui/form';
import DemoNotice from '@/components/membership/DemoNotice';
import { errorMessage } from '@/lib/utils';
import { departments, pgDepartments } from '@/data/site';
import { CART_KEYS } from '@/lib/cart';
import { PROGRAM_LABELS, type Program } from '@/lib/pricing';
import { cn } from '@/lib/utils';

type Form = Omit<UserProfile, 'id' | 'email'>;
const empty: Form = {
  first_name: '',
  last_name: '',
  usn: '',
  department: '',
  year_of_study: '',
  phone: '',
  ieee_member_id: '',
  program: 'UG',
};

export default function ProfilePage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    let alive = true;

    if (hasPaidCookie()) {
      router.replace('/account');
      return;
    }

    const onPageShow = () => {
      if (hasPaidCookie()) {
        router.replace('/account');
      }
    };
    window.addEventListener('pageshow', onPageShow);

    (async () => {
      const paid = await hasUserSubmittedPayment();
      if (!alive) return;
      if (paid) {
        router.replace('/account');
        return;
      }

      const active = await getCurrentUser().catch(() => null);
      if (!alive) return;
      if (!active) {
        router.replace('/membership/register');
        return;
      }
      setUser(active);

      let existing: UserProfile | null = null;
      if (demo) {
        existing = getLocalProfile(active.id);
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('id', active.id).maybeSingle();
        existing = data;
      }
      if (alive && existing) {
        setForm({
          first_name: existing.first_name ?? '',
          last_name: existing.last_name ?? '',
          usn: existing.usn ?? '',
          department: existing.department ?? '',
          year_of_study: existing.year_of_study ?? '',
          phone: existing.phone ?? '',
          ieee_member_id: existing.ieee_member_id ?? '',
          program: existing.program === 'PG' ? 'PG' : 'UG',
        });
      }
      if (alive) setIsLoading(false);
    })();
    return () => {
      alive = false;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [router, demo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');

    const cleanDigits = (form.phone || '').replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    const program = form.program === 'PG' ? 'PG' : 'UG';
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      first_name: form.first_name?.trim(),
      last_name: form.last_name?.trim() || undefined,
      usn: form.usn?.trim().toUpperCase(),
      department: form.department,
      year_of_study: form.year_of_study,
      phone: form.phone?.trim(),
      ieee_member_id: form.ieee_member_id?.trim() || undefined,
      program,
    };

    try {
      if (demo) {
        saveLocalProfile(profile);
      } else {
        const { error: dbError } = await supabase.from('profiles').upsert(profile);
        if (dbError) throw dbError;
      }
      try {
        sessionStorage.setItem(CART_KEYS.program, program);
      } catch {}
      router.push('/membership/chapters');
    } catch (err) {
      setError(errorMessage(err, 'Could not save your details. Please try again.'));
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1fr_380px]">
      <div className="lg:order-2 lg:sticky lg:top-24">
        <div className="panel p-6 sm:p-8">
          <span className="text-xs font-semibold tracking-wider text-brand-orange uppercase">Step 2 of 4</span>
          <h2 className="mt-2 text-2xl font-bold text-ink">Academic details</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            We use your USN, department, and contact info to verify your enrollment with BMSCE and register your profile on the IEEE global roster.
          </p>
          <div className="mt-6 space-y-3.5 border-t border-line pt-5 text-xs text-muted">
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-brand-orange">✓</span>
              <span>Your name should match your official college records.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-brand-orange">✓</span>
              <span>Phone number is used for chapter announcements and payment verification.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-brand-orange">✓</span>
              <span>Existing members renewing can enter their 8-digit IEEE Member ID.</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="panel space-y-6 p-6 sm:p-10 lg:order-1">
        <p className="text-sm text-muted">
          Signed in as <span className="font-medium text-ink">{user?.email}</span>
        </p>

        <div>
          <span id="program-label" className="field-label">Program</span>
          <div role="radiogroup" aria-labelledby="program-label" className="mt-2 grid grid-cols-2 gap-3">
            {(['UG', 'PG'] as const).map((p: Program) => {
              const active = (form.program ?? 'UG') === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() =>
                    setForm((f) => {
                      // Years and departments differ per program: keep selections only if still valid.
                      const validYears = p === 'PG' ? ['1', '2'] : ['1', '2', '3', '4'];
                      const validDepts = (p === 'PG' ? pgDepartments : departments).map(([c]) => c);
                      return {
                        ...f,
                        program: p,
                        year_of_study: validYears.includes(f.year_of_study ?? '') ? f.year_of_study : '',
                        department: validDepts.includes(f.department ?? '') ? f.department : '',
                      };
                    })
                  }
                  className={cn(
                    'rounded-2xl px-4 py-3.5 text-center transition-all',
                    active
                      ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/25'
                      : 'bg-paper text-ink hover:bg-line/70'
                  )}
                >
                  <span className="block text-sm font-bold">{PROGRAM_LABELS[p]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="First name" htmlFor="first_name" required hint="As it should appear on your IEEE membership.">
            <Input id="first_name" icon={User} required autoComplete="given-name" value={form.first_name} onChange={set('first_name')} placeholder="Aditya" />
          </Field>
          <Field label="Last name" htmlFor="last_name" optional hint="Family name / surname.">
            <Input id="last_name" autoComplete="family-name" value={form.last_name} onChange={set('last_name')} placeholder="Sharma" />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="USN" htmlFor="usn" required>
            <Input
              id="usn"
              icon={Hash}
              required
              value={form.usn}
              onChange={set('usn')}
              placeholder="1BM23CS001"
              className="uppercase"
              pattern="[0-9][A-Za-z]{2}[0-9]{2}[A-Za-z]{2,4}[0-9]{3}"
              title="Enter your USN, for example 1BM23CS001"
            />
          </Field>
          <Field label="Year of study" htmlFor="year" required>
            <Select id="year" required value={form.year_of_study} onChange={set('year_of_study')}>
              <option value="">Select year</option>
              {(form.program ?? 'UG') === 'UG' ? (
                <>
                  <option value="1">1st year</option>
                  <option value="2">2nd year</option>
                  <option value="3">3rd year</option>
                  <option value="4">4th year</option>
                </>
              ) : (
                <>
                  <option value="1">1st year</option>
                  <option value="2">2nd year</option>
                </>
              )}
            </Select>
          </Field>
        </div>

        <Field label={(form.program ?? 'UG') === 'PG' ? 'PG program' : 'Department'} htmlFor="department" required>
          <Select id="department" required value={form.department} onChange={set('department')}>
            <option value="">{(form.program ?? 'UG') === 'PG' ? 'Select program' : 'Select department'}</option>
            {((form.program ?? 'UG') === 'PG' ? pgDepartments : departments).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Phone number" htmlFor="phone" required hint="Used for chapter updates and receipt confirmation.">
            <Input id="phone" icon={Phone} type="tel" required autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" pattern="[+0-9 ()-]{10,16}" title="Enter a valid phone number" />
          </Field>
          <Field label="Existing IEEE member ID" htmlFor="ieee_id" optional hint="If you are renewing.">
            <Input id="ieee_id" inputMode="numeric" value={form.ieee_member_id} onChange={set('ieee_member_id')} placeholder="98765432" />
          </Field>
        </div>

        {demo && (
          <DemoNotice>
            Demo mode.{' '}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() =>
                setForm({
                  first_name: 'Aditya',
                  last_name: 'Sharma',
                  usn: '1BM23CS012',
                  department: 'CSE',
                  year_of_study: '2',
                  phone: '+91 98765 43210',
                  ieee_member_id: '',
                  program: 'UG',
                })
              }
            >
              Fill in sample details
            </button>
          </DemoNotice>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
          {isSubmitting && <Spinner />}
          Continue to chapters
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
