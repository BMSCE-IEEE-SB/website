'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Alert, Field, Spinner } from '@/components/ui/form';
import PasswordField from '@/components/membership/PasswordField';
import { errorMessage } from '@/lib/utils';

/** Landing page for Supabase password-reset emails. The link signs the user in, then they set a new password. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
    </div>
  );
}
