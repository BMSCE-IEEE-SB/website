'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LogOut, Mail, MailCheck } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import { DUMMY_CREDENTIALS, clearUserSession, setDummySession } from '@/lib/auth';
import { useSession } from '@/lib/useSession';
import { Alert, Field, Input, PageLoader, Spinner } from '@/components/ui/form';
import AuthShell from '@/components/membership/AuthShell';
import PasswordField from '@/components/membership/PasswordField';
import DemoNotice from '@/components/membership/DemoNotice';
import { LiveCard } from '@/components/membership/Draft';
import { errorMessage } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const { user } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');
  const [pendingEmail, setPendingEmail] = useState('');

  const cleanEmail = email.trim().toLowerCase();
  const nonCollegeEmail = cleanEmail.includes('@') && !cleanEmail.endsWith('@bmsce.ac.in');

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
        router.push('/membership/profile');
        return;
      }
      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/membership/profile` },
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
        router.push('/membership/profile');
        return;
      }

      // If session was not directly returned (e.g. GoTrue email confirmation setting),
      // attempt instant sign-in using the database auto-confirmed credentials.
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInData?.session) {
        router.push('/membership/profile');
        return;
      }

      setPendingEmail(cleanEmail);
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const aside = <LiveCard caption="" />;

  if (user === undefined) return <PageLoader />;

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
    <AuthShell title={<>Start your membership</>} top={aside}>
      <h1 className="text-3xl font-bold sm:text-4xl">Create your account</h1>
      <p className="mt-2 text-ink-soft">
        Already have one?{' '}
        <Link href="/login" className="font-semibold text-brand-orange hover:underline">Sign in</Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field
          label="College email"
          htmlFor="email"
          required
          hint={nonCollegeEmail ? <span className="text-amber-700">Tip: your @bmsce.ac.in email helps us verify you faster.</span> : undefined}
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
          </DemoNotice>
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted">
        By continuing you agree to the <Link href="/terms" className="underline">terms of membership</Link> and the IEEE Code of Ethics.
      </p>
    </AuthShell>
  );
}
