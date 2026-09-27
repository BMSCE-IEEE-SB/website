'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Clock, Layers, LogOut, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import {
  clearUserSession,
  getCurrentUser,
  getLocalOrdersForUser,
  getLocalProfile,
  resubmitLocalOrderProof,
  type Order,
  type SessionUser,
  type UserProfile,
} from '@/lib/auth';
import { adminFetch } from '@/lib/admin-api';
import { Alert, Field, FileDrop, Input, Modal, PageLoader, Spinner, StatusBadge } from '@/components/ui/form';
import { cn, errorMessage, formatDateTime, imageToDataUrl, validateScreenshot } from '@/lib/utils';
import MembershipCard from '@/components/site/MembershipCard';
import Tilt from '@/components/site/Tilt';
import { chapterCode } from '@/data/site';
import { confetti } from '@/lib/confetti';

type OrderRow = Order & { order_items?: { chapters: { name: string } | null }[] };

export default function AccountPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [resubmitting, setResubmitting] = useState<Order | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newUtr, setNewUtr] = useState('');
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState('');

  const load = useCallback(async () => {
    const active = await getCurrentUser().catch(() => null);
    if (!active) {
      router.replace('/login');
      return;
    }
    setUser(active);
    setLoadError('');
    // Only ever switch the banner on: effects can run twice in development.
    if (new URLSearchParams(window.location.search).has('submitted')) {
      setJustSubmitted(true);
      window.history.replaceState(null, '', '/account');
      setTimeout(confetti, 300);
    }

    if (demo) {
      setProfile(getLocalProfile(active.id));
      setOrders(getLocalOrdersForUser(active.id));
    } else {
      const [profileRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', active.id).maybeSingle(),
        supabase.from('orders').select('*, order_items(chapters(name))').eq('user_id', active.id).order('created_at', { ascending: false }),
      ]);
      if (ordersRes.error) setLoadError('We could not load your applications. Please refresh the page.');
      setProfile(profileRes.data ?? null);
      setOrders(
        ((ordersRes.data ?? []) as OrderRow[]).map((o) => ({
          ...o,
          chapters: (o.order_items ?? []).map((i) => i.chapters?.name).filter((n): n is string => Boolean(n)),
        })),
      );
    }
    setIsLoading(false);
  }, [router, demo]);

  // Celebrate once when an application becomes verified.
  useEffect(() => {
    const v = orders.find((o) => o.status === 'verified');
    if (!v) return;
    const key = `bmsce_celebrated_${v.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setTimeout(confetti, 400);
  }, [orders]);

  useEffect(() => {
    // load() only sets state after its first await, so this does not cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const signOut = async () => {
    await clearUserSession();
    router.push('/');
  };

  const openResubmit = (o: Order) => {
    setResubmitting(o);
    setNewFile(null);
    setNewUtr(o.utr_reference ?? '');
    setResubmitError('');
  };

  const closeResubmit = useCallback(() => setResubmitting(null), []);

  async function handleResubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resubmitting || !user) return;
    const fileError = validateScreenshot(newFile);
    if (fileError) return setResubmitError(fileError);
    const cleanUtr = newUtr.replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleanUtr)) return setResubmitError('Enter the 12-digit UPI reference (UTR).');

    setIsResubmitting(true);
    setResubmitError('');
    try {
      if (demo) {
        resubmitLocalOrderProof(resubmitting.id, await imageToDataUrl(newFile!), cleanUtr);
      } else {
        const form = new FormData();
        form.set('file', newFile!);
        form.set('orderId', resubmitting.id);
        form.set('utr', cleanUtr);
        const upload = await adminFetch('/api/checkout/proof', { method: 'POST', body: form });
        const uploaded = await upload.json();
        if (!upload.ok) throw new Error(uploaded.error || 'Proof upload failed.');
        const response = await adminFetch('/api/checkout/resubmit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: resubmitting.id, proofPath: uploaded.path, utr: cleanUtr }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Resubmission failed.');
      }
      setResubmitting(null);
      await load();
    } catch (err) {
      setResubmitError(errorMessage(err, 'Resubmission failed. Please try again.'));
    } finally {
      setIsResubmitting(false);
    }
  }

  if (isLoading) return <PageLoader />;

  const latest = orders[0];
  const trackerSteps = [
    { label: 'Submitted', done: Boolean(latest), detail: latest ? formatDateTime(latest.created_at) : 'Not yet' },
    {
      label: latest?.status === 'rejected' ? 'Needs attention' : 'Under review',
      done: latest?.status === 'verified' || latest?.status === 'rejected',
      detail: latest?.status === 'pending' ? 'Usually 2–3 working days' : latest?.status === 'rejected' ? 'See feedback below' : latest?.status === 'verified' ? 'Payment matched' : '—',
      bad: latest?.status === 'rejected',
    },
    { label: 'Verified member', done: latest?.status === 'verified', detail: latest?.verified_at ? formatDateTime(latest.verified_at) : 'Welcome email follows' },
  ];
  const cardChapters = (latest?.chapters ?? []).map(chapterCode).slice(0, 4);

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-brand-sky/10 to-transparent" />
      <div className="container-page py-10 sm:py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">Member portal</p>
            <h1 className="display mt-2 truncate text-4xl text-ink sm:text-5xl">{profile?.full_name ? `Hi, ${profile.full_name.split(' ')[0]}` : 'Hi there'}</h1>
            <p className="mt-2 truncate text-sm text-muted">{user?.email}</p>
          </div>
          <button type="button" onClick={signOut} className="btn btn-ghost self-start bg-white sm:self-auto">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        {justSubmitted && (
          <Alert tone="success" className="mt-8">
            Registration submitted. The branch team will verify your payment and email you once your membership is confirmed.
          </Alert>
        )}
        {loadError && <Alert tone="error" className="mt-8">{loadError}</Alert>}

        {/* Card + tracker */}
        <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-[440px_1fr]">
          <div className="panel flex flex-col justify-between gap-6 p-6">
            <Tilt className="rounded-[22px]" max={10}>
              <MembershipCard
                data={{
                  name: profile?.full_name,
                  usn: profile?.usn,
                  department: profile?.department,
                  year: profile?.year_of_study,
                  chapters: cardChapters,
                  status: latest ? latest.status : 'draft',
                  reference: latest?.order_reference,
                }}
              />
            </Tilt>
            <p className="text-center text-sm text-muted">
              {latest?.status === 'verified' ? 'Your membership is active. Show this card at branch events.' : 'Your card activates once your payment is verified.'}
            </p>
          </div>

          <div className="panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">Application status</h2>
              {latest && <StatusBadge status={latest.status} />}
            </div>
            {latest ? (
              <>
                <ol className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-0">
                  {trackerSteps.map((st, i) => (
                    <li key={st.label} className="relative flex gap-4 sm:flex-col sm:gap-3 sm:pr-6">
                      {i < trackerSteps.length - 1 && (
                        <span aria-hidden className={cn('absolute top-10 bottom-[-24px] left-[19px] w-0.5 sm:top-[19px] sm:right-0 sm:bottom-auto sm:left-12 sm:h-0.5 sm:w-auto', trackerSteps[i + 1].done || (i === 0 && st.done) ? 'bg-brand-navy' : 'bg-line')} />
                      )}
                      <span
                        className={cn(
                          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white',
                          st.bad ? 'bg-red-500 text-white' : st.done ? 'bg-brand-navy text-white' : 'bg-paper text-muted',
                          !st.done && i === 1 && latest.status === 'pending' && 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {st.bad ? <X className="h-4 w-4" /> : st.done ? <Check className="h-4 w-4" strokeWidth={3} /> : i === 1 ? <Clock className="h-4 w-4 animate-pulse" /> : i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{st.label}</p>
                        <p className="mt-0.5 text-sm text-muted">{st.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                {latest.status === 'rejected' && (
                  <div className="mt-8 rounded-2xl bg-red-50 p-5 text-sm">
                    <p className="font-semibold text-red-800">Feedback from the branch team</p>
                    <p className="mt-1 text-red-700">{latest.rejection_reason || 'The screenshot was unclear or the transaction could not be matched.'}</p>
                    <button type="button" onClick={() => openResubmit(latest)} className="btn btn-primary mt-4">
                      <RefreshCw className="h-4 w-4" /> Resubmit proof
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6 rounded-2xl bg-paper p-6">
                <p className="text-ink-soft">You haven&apos;t submitted a membership application yet. Pick up where you left off.</p>
                <Link href={profile ? '/membership/chapters' : '/membership/profile'} className="btn btn-primary mt-5">
                  Continue registration <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { href: '/membership', icon: Plus, title: 'Add chapters', text: 'Start a new application with more chapters.' },
            { href: '/#events', icon: CalendarDays, title: 'Upcoming events', text: 'Hackathons, workshops and talks this term.' },
            { href: '/#chapters', icon: Layers, title: 'Explore chapters', text: 'See what each community is working on.' },
          ].map((q) => (
            <Link key={q.title} href={q.href} className="group panel flex items-start gap-4 p-5 transition-transform hover:-translate-y-1">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-paper text-brand-orange transition-colors group-hover:bg-brand-orange group-hover:text-white">
                <q.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between font-semibold text-ink">
                  {q.title} <ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
                <span className="mt-0.5 block text-sm text-muted">{q.text}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Profile</h2>
              <Link href="/membership/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navy hover:text-brand-orange">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            </div>
            {profile ? (
              <dl className="mt-5 space-y-4 text-sm">
                {[
                  ['Name', profile.full_name],
                  ['USN', profile.usn],
                  ['Department', profile.department],
                  ['Year', profile.year_of_study],
                  ['Phone', profile.phone],
                  ['IEEE member ID', profile.ieee_member_id],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted">{k}</dt>
                      <dd className="mt-0.5 font-medium text-ink">{v}</dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted">
                You haven&apos;t added your details yet.{' '}
                <Link href="/membership/profile" className="font-semibold text-brand-navy underline">Add them now</Link>
              </p>
            )}
          </aside>

          <section>
            <h2 className="text-lg font-bold">All applications</h2>
            {orders.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nothing here yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {orders.map((o) => (
                  <li key={o.id} className="panel p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-brand-navy">{o.order_reference}</p>
                        <p className="mt-0.5 text-xs text-muted">Submitted {formatDateTime(o.created_at)}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs text-muted">Amount</dt>
                        <dd className="mt-0.5 display text-xl">₹{o.total_amount}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-muted">UTR</dt>
                        <dd className="mt-0.5 truncate font-mono">{o.utr_reference || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">Official T-Shirt</dt>
                        <dd className="mt-0.5 font-medium">{o.tshirt_size ? `Size ${o.tshirt_size}` : 'Standard'}</dd>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <dt className="text-xs text-muted">Chapters</dt>
                        <dd className="mt-0.5">{o.chapters?.length ? o.chapters.join(', ') : 'Base membership only'}</dd>
                      </div>
                    </dl>
                    {o.status === 'pending' && (
                      <p className="mt-5 rounded-2xl bg-paper px-4 py-3 text-sm text-ink-soft">Your payment is queued for review. You will get an email once it is verified.</p>
                    )}
                    {o.status === 'verified' && (
                      <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Welcome to BMSCE IEEE. Your IEEE.org credentials will be shared once headquarters provisions them.</p>
                    )}
                    {o.status === 'rejected' && o !== latest && (
                      <button type="button" onClick={() => openResubmit(o)} className="btn btn-primary mt-5">
                        <RefreshCw className="h-4 w-4" /> Resubmit proof
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {resubmitting && (
        <Modal title="Resubmit payment proof" onClose={closeResubmit}>
          <p className="-mt-2 mb-5 text-sm text-muted">
            Order <span className="font-mono font-semibold text-brand-navy">{resubmitting.order_reference}</span> · ₹{resubmitting.total_amount}. No new payment is needed.
          </p>
          <form onSubmit={handleResubmit} className="space-y-5">
            <Field label="New screenshot" htmlFor="resubmit-file" required>
              <FileDrop id="resubmit-file" file={newFile} onChange={setNewFile} label="Choose a clear screenshot" />
            </Field>
            <Field label="UPI reference (UTR)" htmlFor="resubmit-utr" required>
              <Input id="resubmit-utr" inputMode="numeric" value={newUtr} onChange={(e) => setNewUtr(e.target.value)} placeholder="423456789012" maxLength={14} />
            </Field>
            {resubmitError && <Alert tone="error">{resubmitError}</Alert>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeResubmit} className="btn btn-ghost">Cancel</button>
              <button type="submit" disabled={isResubmitting} className="btn btn-primary">
                {isResubmitting && <Spinner />} Submit for review
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
