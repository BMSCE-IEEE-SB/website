'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Smartphone } from 'lucide-react';
import { loadPricing, loadPayee, type Pricing, type Payee, FALLBACK_PAYEE } from '@/lib/pricing';
import { PageLoader } from '@/components/ui/form';

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
      <Copy className="h-3 w-3" />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function PaymentPage() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [payee, setPayee] = useState<Payee>(FALLBACK_PAYEE);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [pricingData, payeeData] = await Promise.all([loadPricing(), loadPayee()]);
        if (alive) {
          setPricing(pricingData);
          setPayee(payeeData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setIsLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  if (isLoading) return <PageLoader />;
  if (!pricing) return <div className="p-8 text-center text-red-500">Failed to load pricing configuration.</div>;

  const chaptersTotal = pricing.chapters
    .filter((c) => selectedChapters.has(c.id))
    .reduce((sum, c) => sum + c.price, 0);

  const total = pricing.baseFee + chaptersTotal;
  const upiLink = `upi://pay?pa=${encodeURIComponent(payee.vpa)}&pn=${encodeURIComponent(payee.name)}&am=${total.toFixed(2)}&cu=INR&tn=REGISTRATION`;

  const toggleChapter = (id: string) => {
    const next = new Set(selectedChapters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedChapters(next);
  };

  return (
    <div className="min-h-screen bg-sand pb-20 pt-24 sm:pt-32">
      <div className="container-page max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-ink">Dynamic QR Generator</h1>
          <p className="mt-2 text-muted">Select chapters to adjust the total payment amount.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Selection */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-line">
            <h2 className="mb-4 text-lg font-semibold text-ink">Fee Breakdown</h2>
            
            <div className="mb-6 rounded-xl bg-sky-50 p-4">
              <div className="flex justify-between font-medium text-brand-navy">
                <span>Base Membership Fee</span>
                <span>₹{pricing.baseFee}</span>
              </div>
              <p className="mt-1 text-xs text-sky-800">Included by default</p>
            </div>

            <h3 className="mb-3 font-medium text-ink">Chapters & Affinity Groups</h3>
            <div className="space-y-2">
              {pricing.chapters.map((chapter) => (
                <label
                  key={chapter.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-line p-3 transition-colors hover:bg-sand/50 has-[:checked]:border-brand-blue has-[:checked]:bg-sky-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedChapters.has(chapter.id)}
                      onChange={() => toggleChapter(chapter.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="text-sm font-medium text-ink">{chapter.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-muted">
                    {chapter.price > 0 ? `₹${chapter.price}` : 'Free'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Right Column: QR Code */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm ring-1 ring-line">
            <div className="mb-6 text-center">
              <div className="text-sm font-medium text-muted">Total Amount</div>
              <div className="text-4xl font-bold text-brand-navy">₹{total}</div>
            </div>

            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line">
              <QRCodeSVG id="upi-qr" value={upiLink} size={208} level="M" marginSize={0} />
            </div>

            <div className="w-full space-y-4">
              <div className="rounded-xl bg-sand p-4 text-center">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-muted">UPI ID</span>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <a href={upiLink} className="font-mono text-sm font-bold text-brand-blue underline decoration-brand-blue/40 underline-offset-4 transition-colors hover:text-brand-navy" title="Tap to open your UPI app">
                    {payee.vpa}
                  </a>
                  <CopyButton value={payee.vpa} label="UPI ID" />
                </div>
              </div>

              <a href={upiLink} className="btn btn-dark w-full justify-center">
                <Smartphone className="h-4 w-4" /> Open UPI App (₹{total})
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
