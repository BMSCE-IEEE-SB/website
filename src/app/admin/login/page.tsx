'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import { DUMMY_ADMIN_CREDENTIALS, setDummyAdminSession } from '@/lib/auth';
import { Alert, Field, Input, Spinner } from '@/components/ui/form';
import DemoNotice from '@/components/membership/DemoNotice';
import { errorMessage } from '@/lib/utils';

export default function AdminLoginPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const next = new URLSearchParams(window.location.search).get('next');
      const dest = next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin';
      if (demo) {
        setDummyAdminSession(email.trim().toLowerCase());
        router.push(dest);
        return;
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (authError) throw authError;
      const { data: admin } = await supabase.from('admins').select('role').eq('id', data.user.id).maybeSingle();
      if (!admin) {
        await supabase.auth.signOut();
        throw new Error('This account does not have branch administrator access.');
      }
      router.push(dest);
    } catch (err) {
      setError(errorMessage(err, 'Invalid administrator credentials.'));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-14 sm:py-20">
      <div className="w-full max-w-md">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy text-white">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-2xl font-bold sm:text-3xl">Executive sign in</h1>
          <p className="mt-2 text-sm text-muted">For BMSCE IEEE Executive Committee members only.</p>
        </div>

        <form onSubmit={handleSubmit} className="panel mt-8 space-y-5 p-6 sm:p-8">
          <Field label="Email" htmlFor="admin-email" required>
            <Input id="admin-email" icon={Mail} type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@bmsce.ac.in" />
          </Field>
          <Field label="Password" htmlFor="admin-password" required>
            <Input id="admin-password" icon={Lock} type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <button type="submit" disabled={isSubmitting} className="btn btn-dark btn-lg w-full">
            {isSubmitting && <Spinner />} Sign in {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
          {demo && (
            <DemoNotice>
              Demo mode. Any credentials open the sample dashboard.{' '}
              <button
                type="button"
                className="font-semibold underline underline-offset-2"
                onClick={() => {
                  setEmail(DUMMY_ADMIN_CREDENTIALS.email);
                  setPassword(DUMMY_ADMIN_CREDENTIALS.password);
                }}
              >
                Use demo admin
              </button>
            </DemoNotice>
          )}
        </form>
      </div>
    </div>
  );
}
