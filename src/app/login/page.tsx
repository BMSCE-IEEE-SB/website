'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, LogOut, Mail } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import { DUMMY_CREDENTIALS, clearUserSession, setDummySession } from '@/lib/auth';
import { useSession } from '@/lib/useSession';
import { Alert, Field, Input, PageLoader, Spinner } from '@/components/ui/form';
import AuthShell from '@/components/membership/AuthShell';
import PasswordField from '@/components/membership/PasswordField';
import DemoNotice from '@/components/membership/DemoNotice';
import { errorMessage } from '@/lib/utils';

const perks = ['Track your application status', 'View your membership details & receipts', 'Add chapters any time'];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demo = isDemoMode();
  const { user } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const redirectParam = searchParams.get('redirect');
  const redirectTarget =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : '/account';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setUnconfirmedEmail('');
    setIsSubmitting(true);
    try {
      const clean = email.trim().toLowerCase();
      if (demo) setDummySession(clean);
      else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: clean, password });
        if (signInError) throw signInError;
      }
      router.push(redirectTarget);
    } catch (err) {
      const msg = errorMessage(err, 'Could not sign you in. Check your email and password.');
      if (/not confirmed/i.test(msg)) {
        setUnconfirmedEmail(email.trim().toLowerCase());
        setError('This email address has not been confirmed yet, so sign-in is blocked even with the right password.');
      } else {
        setError(msg);
      }
      setIsSubmitting(false);
    }
  }

  async function resendConfirmation() {
    if (!unconfirmedEmail || resending) return;
    setResending(true);
    setError('');
    setInfo('');
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: unconfirmedEmail });
      if (resendError) throw resendError;
      setInfo(`Confirmation email resent to ${unconfirmedEmail}. Check spam/promotions if it is not in your inbox within a few minutes.`);
    } catch (err) {
      setError(errorMessage(err, 'Could not resend the confirmation email. Try again in a few minutes.'));
    } finally {
      setResending(false);
    }
  }

  async function forgot() {
    setError('');
    const clean = email.trim().toLowerCase();
    if (!clean) return setError('Enter your email above first, then tap "Forgot password".');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: `${window.location.origin}/login/reset` });
    if (resetError) setError(resetError.message);
    else setInfo(`If an account exists for ${clean}, a reset link is on its way. Check spam/promotions if you do not see it within a few minutes.`);
  }

  const top = (
    <ul className="space-y-3">
      {perks.map((p, i) => (
        <li key={p} className="flex items-center gap-3 text-white/85">
          <span className="font-mono text-xs text-brand-orange">0{i + 1}</span> {p}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="container-page py-10 sm:py-16">
      {user === undefined ? (
        <PageLoader />
      ) : user ? (
        <AuthShell title={<>Member portal</>} top={top}>
          <div className="flex h-full flex-col justify-center py-6">
            <p className="text-sm font-medium text-muted">You&apos;re signed in as</p>
            <p className="mt-1 truncate text-2xl font-bold text-ink">{user.email}</p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href={redirectTarget} className="btn btn-primary btn-lg w-full">
                Open my portal <ArrowRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => clearUserSession()} className="btn btn-ghost btn-lg w-full">
                <LogOut className="h-4 w-4" /> Sign in with another account
              </button>
            </div>
          </div>
        </AuthShell>
      ) : (
        <AuthShell title={<>Member portal</>} top={top}>
          <h1 className="text-3xl font-bold sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-ink-soft">
            New here?{' '}
            <Link href="/membership" className="font-semibold text-brand-orange hover:underline">Become a member</Link>
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="Email" htmlFor="login-email" required>
              <Input id="login-email" icon={Mail} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname.dept23@bmsce.ac.in" />
            </Field>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-ink">Password <span className="text-brand-orange">*</span></label>
                {!demo && (
                  <button type="button" onClick={forgot} className="text-xs font-semibold text-brand-navy hover:text-brand-orange">
                    Forgot password?
                  </button>
                )}
              </div>
              <PasswordField id="login-password" value={password} onChange={setPassword} autoComplete="current-password" />
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            {unconfirmedEmail && !info && (
              <button type="button" onClick={resendConfirmation} disabled={resending} className="btn btn-ghost btn-lg w-full">
                {resending && <Spinner />} Resend confirmation email
              </button>
            )}
            {info && <Alert tone="success">{info}</Alert>}
            <button type="submit" disabled={isSubmitting} className="btn btn-dark btn-lg w-full">
              {isSubmitting && <Spinner />} Sign in {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
          {demo && (
            <div className="mt-6">
              <DemoNotice>
                <strong>Demo mode.</strong> Any email and password work.{' '}
                <button
                  type="button"
                  className="font-semibold underline underline-offset-2"
                  onClick={() => {
                    setEmail(DUMMY_CREDENTIALS.email);
                    setPassword(DUMMY_CREDENTIALS.password);
                  }}
                >
                  Fill test account
                </button>
              </DemoNotice>
            </div>
          )}
        </AuthShell>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}
