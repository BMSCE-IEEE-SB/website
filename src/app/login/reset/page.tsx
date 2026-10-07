'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Alert, Field, Spinner } from '@/components/ui/form';
import PasswordField from '@/components/membership/PasswordField';
import { errorMessage } from '@/lib/utils';

async function prepareRecoverySession() {
  const url = new URL(window.location.href);
  const linkError = url.searchParams.get('error_description');
  if (linkError) throw new Error(linkError);

  const tokenHash = url.searchParams.get('token_hash');
  if (tokenHash) {
    const { error: verificationError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (verificationError) throw verificationError;
  }

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!data.session) throw new Error('This reset link is missing its recovery session. Request a new link and open it in the same browser.');

  window.history.replaceState({}, document.title, url.pathname);
}

/** Landing page for Supabase password-reset emails. The link signs the user in, then they set a new password. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [recoveryError, setRecoveryError] = useState('');
  const recoverySession = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let active = true;
    recoverySession.current ??= prepareRecoverySession();
    recoverySession.current.then(
      () => {
        if (active) setRecoveryStatus('ready');
      },
      (err: unknown) => {
        if (!active) return;
        setRecoveryError(errorMessage(err, 'This reset link has expired. Request a new one from the sign-in page.'));
        setRecoveryStatus('invalid');
      },
    );
    return () => {
      active = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (recoveryStatus !== 'ready') return;
    setBusy(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push('/account');
    } catch (err) {
      setError(errorMessage(err, 'This reset link has expired. Request a new one from the sign-in page.'));
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      {recoveryStatus === 'checking' ? (
        <div className="panel flex w-full max-w-md items-center justify-center gap-3 p-8" role="status">
          <Spinner /> Verifying reset link
        </div>
      ) : recoveryStatus === 'invalid' ? (
        <div className="panel w-full max-w-md space-y-5 p-8">
          <h1 className="text-2xl font-bold">Reset link unavailable</h1>
          <Alert tone="error">{recoveryError}</Alert>
          <Link href="/login" className="btn btn-primary btn-lg w-full">Request another reset link</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="panel w-full max-w-md space-y-5 p-8">
          <h1 className="text-2xl font-bold">Choose a new password</h1>
          <Field label="New password" htmlFor="new-password" required>
            <PasswordField id="new-password" value={password} onChange={setPassword} autoComplete="new-password" showStrength />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
            {busy && <Spinner />} Save password
          </button>
        </form>
      )}
    </div>
  );
}
