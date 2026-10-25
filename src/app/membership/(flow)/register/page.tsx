'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LogOut, Mail, MailCheck } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import { DUMMY_CREDENTIALS, clearUserSession, hasPaidCookie, hasUserSubmittedPayment, resetDemoData, setDummySession } from '@/lib/auth';
import { useSession } from '@/lib/useSession';
import { Alert, Field, Input, PageLoader, Spinner } from '@/components/ui/form';
import AuthShell from '@/components/membership/AuthShell';
import PasswordField from '@/components/membership/PasswordField';
import DemoNotice from '@/components/membership/DemoNotice';
import { errorMessage } from '@/lib/utils';
import { MEMBERSHIP_DRIVE_OPEN, MEMBERSHIP_DRIVE_YEAR } from '@/config/membership';
import { loadDriveStatus } from '@/lib/pricing';

export default function RegisterPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const { user } = useSession();
  const [isDriveOpen, setIsDriveOpen] = useState(MEMBERSHIP_DRIVE_OPEN);
  const [checkingDrive, setCheckingDrive] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    let alive = true;
    loadDriveStatus()
      .then((open) => {
        if (alive) {
          setIsDriveOpen(open);
          setCheckingDrive(false);
        }
      })
      .catch(() => {
        if (alive) setCheckingDrive(false);
      });
    return () => {
      alive = false;
    };
  }, []);

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
      }
    })();

    return () => {
      alive = false;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [router]);

  const cleanEmail = email.trim().toLowerCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (demo) {
        setDummySession(cleanEmail);
        router.push(isDriveOpen ? '/membership/profile' : '/ieeextreme/register');
        return;
      }
      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}${isDriveOpen ? '/membership/profile' : '/ieeextreme/register'}` },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setError(
            <span>
              An account with this email already exists.{' '}
              <Link href={`/login?redirect=/membership/profile`} className="font-semibold underline underline-offset-2">
                Sign in here
              </Link>
              {' '}or reset your password.
            </span>
          );
          return;
        }
        throw authError;
      }

      // Check if Supabase detected a duplicate user (empty identities array)
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError(
          <span>
            An account with this email already exists.{' '}
            <Link href={`/login?redirect=/membership/profile`} className="font-semibold underline underline-offset-2">
              Sign in here
            </Link>
            {' '}or reset your password.
          </span>
        );
        return;
      }

      if (data?.session) {
        router.push(isDriveOpen ? '/membership/profile' : '/ieeextreme/register');
        return;
      }

      // If session was not directly returned (e.g. GoTrue email confirmation setting),
      // attempt instant sign-in using the database auto-confirmed credentials.
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInData?.session) {
        router.push(isDriveOpen ? '/membership/profile' : '/ieeextreme/register');
        return;
      }

      setPendingEmail(cleanEmail);
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const steps = [
    'Create your account with your college email',
    'Add your program (UG/PG) & academic details',
    'Pick technical chapters & select T-shirt size',
    'Pay securely with UPI & upload screenshot',
  ];

  const aside = (
    <ul className="space-y-3">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-3 text-white/85">
          <span className="font-mono text-xs text-brand-orange">0{i + 1}</span> {s}
        </li>
      ))}
    </ul>
  );

  if (user === undefined || (checkingDrive && !MEMBERSHIP_DRIVE_OPEN)) return <PageLoader />;

  if (!isDriveOpen) {
    if (user) {
      return (
        <AuthShell title={<>Membership Closed</>} top={aside}>
          <div className="flex h-full flex-col justify-center py-6">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-muted">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              {MEMBERSHIP_DRIVE_YEAR} Applications Closed
            </span>
            <h1 className="mt-4 text-3xl font-bold">Drive has ended</h1>
            <p className="mt-2 text-sm text-ink-soft">
              You&apos;re signed in as <strong className="text-ink">{user.email}</strong>. New membership registrations are closed for now. Meanwhile, squads are forming for IEEEXtreme 20.0!
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/ieeextreme/register" className="btn btn-primary btn-lg w-full">
                Register as Team Lead <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/account" className="btn btn-ghost btn-lg w-full">
                Go to member portal
              </Link>
              <button type="button" onClick={() => clearUserSession()} className="btn btn-lg w-full text-muted hover:text-ink">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </AuthShell>
      );
    }
    // Drive is closed but unauthenticated — fall through to show the account
    // creation form; handleSubmit will redirect to IEEEXtreme team lead signup.
  }

  if (pendingEmail) {
    return (
      <AuthShell title={<>Almost there</>} top={aside}>
        <div className="flex h-full flex-col items-center justify-center py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-brand-sky">
            <MailCheck className="h-8 w-8" />
          </span>
          <h1 className="mt-6 text-3xl font-bold">Check your inbox</h1>
          <p className="mt-3 max-w-sm text-ink-soft">
            We sent a verification link to <strong className="text-ink">{pendingEmail}</strong>. Open it to confirm your email and continue.
          </p>
          <Link href="/login" className="btn btn-ghost mt-8">I&apos;ve verified, sign me in</Link>
        </div>
      </AuthShell>
    );
  }

  // Already signed in: don't show a sign-up form, offer to continue instead.
  if (user) {
    return (
      <AuthShell title={<>Welcome back</>} top={aside}>
        <div className="flex h-full flex-col justify-center py-6">
          <p className="text-sm font-medium text-muted">You&apos;re signed in as</p>
          <p className="mt-1 truncate text-2xl font-bold text-ink">{user.email}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/membership/profile" className="btn btn-primary btn-lg w-full">
              Continue registration <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/account" className="btn btn-ghost btn-lg w-full">Go to member portal</Link>
            <button type="button" onClick={() => clearUserSession()} className="btn btn-lg w-full text-muted hover:text-ink">
              <LogOut className="h-4 w-4" /> Use a different account
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={isDriveOpen ? <>Start your membership</> : <>IEEEXtreme Team Lead</>} top={aside}>
      <h1 className="text-3xl font-bold sm:text-4xl">{isDriveOpen ? 'Create your account' : 'Create account to continue'}</h1>
      <p className="mt-2 text-ink-soft">
        {isDriveOpen ? (
          <>
            Already have one?{' '}
            <Link href="/login" className="font-semibold text-brand-orange hover:underline">Sign in</Link>
          </>
        ) : (
          <>
            Sign up to register as IEEEXtreme 20.0 Team Lead.{' '}
            <Link href="/login?redirect=%2Fieeextreme%2Fregister" className="font-semibold text-brand-orange hover:underline">Already have an account?</Link>
          </>
        )}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field
          label="Email"
          htmlFor="email"
          required
          hint="Use your college email or one linked to your IEEE account."
        >
          <Input id="email" icon={Mail} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname.dept23@bmsce.ac.in" />
        </Field>
        <Field label="Password" htmlFor="password" required>
          <PasswordField id="password" value={password} onChange={setPassword} autoComplete="new-password" showStrength />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" required hint={confirmPassword && confirmPassword !== password ? <span className="text-red-600">Passwords don&apos;t match yet.</span> : undefined}>
          <PasswordField id="confirm" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        </Field>

        {error && <Alert tone="error">{error}</Alert>}

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
          {isSubmitting ? <Spinner /> : null}
          Create account
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {demo && (
        <div className="mt-6">
          <DemoNotice>
            <strong>Demo mode.</strong> No database is connected, so any email and password work.{' '}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => {
                setEmail(DUMMY_CREDENTIALS.email);
                setPassword(DUMMY_CREDENTIALS.password);
                setConfirmPassword(DUMMY_CREDENTIALS.password);
              }}
            >
              Fill test account
            </button>
            {' · '}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => {
                if (window.confirm('Clear all saved demo data and start fresh?')) {
                  resetDemoData();
                  window.location.reload();
                }
              }}
            >
              Reset demo data
            </button>
          </DemoNotice>
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted">
        By continuing you agree to the <Link href="/privacy" className="underline">privacy policy</Link> and the IEEE Code of Ethics.
      </p>
    </AuthShell>
  );
}
