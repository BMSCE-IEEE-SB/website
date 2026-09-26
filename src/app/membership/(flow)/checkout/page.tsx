'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Check, Copy, Download, Smartphone } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import { getCurrentUser, saveLocalOrder, type SessionUser } from '@/lib/auth';
import { clearCart, getOrCreateOrderRef, readCart, type CartChapter } from '@/lib/cart';
import { uploadScreenshot } from '@/lib/orders';
import { Alert, Field, FileDrop, Input, PageLoader, Spinner } from '@/components/ui/form';
import DemoNotice from '@/components/membership/DemoNotice';
import { errorMessage, imageToDataUrl, validateScreenshot } from '@/lib/utils';

const FALLBACK_VPA = 'bmsceieee@okhdfcbank';
const FALLBACK_PAYEE = 'BMSCE IEEE Student Branch';

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-brand-navy transition-colors hover:bg-sky-50"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [chapters, setChapters] = useState<CartChapter[]>([]);
  const [baseFee, setBaseFee] = useState(0);
  const [orderRef, setOrderRef] = useState('');
  const [vpa, setVpa] = useState(FALLBACK_VPA);
  const [payee, setPayee] = useState(FALLBACK_PAYEE);
  const [isLoading, setIsLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [utr, setUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const active = await getCurrentUser().catch(() => null);
      if (!alive) return;
      if (!active) {
        router.replace('/membership/register');
        return;
      }
      const cart = readCart();
      if (!cart) {
        // Opened checkout directly: the amount is unknown, so pick chapters first.
        router.replace('/membership/chapters');
        return;
      }
      setUser(active);
      setChapters(cart.chapters);
      setBaseFee(cart.baseFee);
      setOrderRef(getOrCreateOrderRef());

      if (!demo) {
        const { data } = await supabase.from('membership_config').select('payee_vpa, payee_name').eq('id', 1).maybeSingle();
        if (alive && data?.payee_vpa) setVpa(data.payee_vpa);
        if (alive && data?.payee_name) setPayee(data.payee_name);
      }
      if (alive) setIsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [router, demo]);

  const total = baseFee + chapters.reduce((s, c) => s + Number(c.price), 0);
  const upiLink = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payee)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderRef)}`;

  const downloadQR = () => {
    const svg = document.getElementById('upi-qr');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 480, 480);
      ctx.drawImage(img, 24, 24, 432, 432);
      const a = document.createElement('a');
      a.download = `BMSCE_IEEE_${orderRef}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const fileError = validateScreenshot(file);
    if (fileError) {
      setError(fileError);
      return;
    }
    const cleanUtr = utr.replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleanUtr)) {
      setError('Enter the 12-digit UPI reference (UTR) shown in your payment app.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      if (demo) {
        saveLocalOrder({
          id: 'ord-' + crypto.randomUUID().slice(0, 8),
          user_id: user.id,
          email: user.email,
          base_fee: baseFee,
          total_amount: total,
          payment_screenshot_url: await imageToDataUrl(file!),
          utr_reference: cleanUtr,
          order_reference: orderRef,
          status: 'pending',
          created_at: new Date().toISOString(),
          chapters: chapters.map((c) => c.name),
        });
      } else {
        const path = await uploadScreenshot(user.id, orderRef, file!);
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            base_fee: baseFee,
            total_amount: total,
            payment_screenshot_url: path,
            utr_reference: cleanUtr,
            order_reference: orderRef,
            status: 'pending',
          })
          .select('id')
          .single();
        if (orderError) throw orderError;

        if (chapters.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(chapters.map((c) => ({ order_id: order.id, chapter_id: c.id, price_at_purchase: c.price })));
          if (itemsError) throw itemsError;
        }
      }
      clearCart();
      router.push('/account?submitted=1');
    } catch (err) {
      setError(errorMessage(err, 'We could not submit your registration. Please try again.'));
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Pay and submit</h1>
        <p className="lead mx-auto mt-3 max-w-xl">Pay the exact amount with any UPI app, then upload the payment screenshot.</p>
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-2">
        {/* Step A: pay */}
        <section className="panel p-6 sm:p-8" aria-labelledby="pay-title">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">1</span>
            <h2 id="pay-title" className="text-lg font-bold">Pay ₹{total}</h2>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="rounded-3xl bg-white p-4 ring-1 ring-line">
              <QRCodeSVG id="upi-qr" value={upiLink} size={208} level="M" marginSize={0} />
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              <button type="button" onClick={downloadQR} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper">
                <Download className="h-3.5 w-3.5" /> Save QR
              </button>
            </div>
            <a href={upiLink} className="btn btn-dark mt-4 w-full sm:hidden">
              <Smartphone className="h-4 w-4" /> Open UPI app
            </a>
          </div>

          <dl className="mt-6 divide-y divide-line rounded-2xl bg-paper px-4 text-sm">
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-muted">Amount</dt>
              <dd className="flex items-center gap-1 font-display text-lg font-bold text-ink">
                ₹{total} <CopyButton value={String(total)} label="amount" />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-muted">UPI ID</dt>
              <dd className="flex min-w-0 items-center gap-1 font-mono text-[13px] font-medium text-ink">
                <span className="truncate">{vpa}</span> <CopyButton value={vpa} label="UPI ID" />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-muted">Order reference</dt>
              <dd className="font-mono text-[13px] font-semibold text-brand-navy">{orderRef}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted">Add the order reference in the payment note if your UPI app lets you.</p>
        </section>

        {/* Step B: proof */}
        <section className="panel p-6 sm:p-8" aria-labelledby="proof-title">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">2</span>
            <h2 id="proof-title" className="text-lg font-bold">Upload proof of payment</h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <Field label="Payment screenshot" htmlFor="proof" required>
              <FileDrop id="proof" file={file} onChange={(f) => { setFile(f); setError(''); }} />
            </Field>
            <Field label="UPI reference number (UTR)" htmlFor="utr" required hint="The 12-digit number in your payment app's transaction details.">
              <Input id="utr" inputMode="numeric" required value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="423456789012" maxLength={14} />
            </Field>

            {demo && <DemoNotice>Demo mode. Any image and any 12-digit number will work. Nothing is charged.</DemoNotice>}
            {error && <Alert tone="error">{error}</Alert>}

            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
              {isSubmitting && <Spinner />}
              {isSubmitting ? 'Submitting…' : 'Submit registration'}
            </button>
            <Link href="/membership/chapters" className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Change chapters
            </Link>
          </form>
        </section>
      </div>
    </div>
  );
}
