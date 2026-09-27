'use client';

import { X } from 'lucide-react';

type SizeChartProps = {
  onClose: () => void;
};

const sizes = [
  { size: 'S', chest: '36-38', length: '27', shoulder: '16' },
  { size: 'M', chest: '38-40', length: '28', shoulder: '17' },
  { size: 'L', chest: '40-42', length: '29', shoulder: '18' },
  { size: 'XL', chest: '42-44', length: '30', shoulder: '19' },
  { size: '2XL', chest: '44-46', length: '31', shoulder: '20' },
  { size: '3XL', chest: '46-48', length: '32', shoulder: '21' },
];

export default function SizeChart({ onClose }: SizeChartProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="panel w-full max-w-2xl overflow-hidden p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-xl font-bold text-ink">T-Shirt Size Chart</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink"
            aria-label="Close size chart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-3 pr-4 font-bold text-ink">Size</th>
                  <th className="pb-3 pr-4 font-medium text-muted">Chest (inches)</th>
                  <th className="pb-3 pr-4 font-medium text-muted">Length (inches)</th>
                  <th className="pb-3 font-medium text-muted">Shoulder (inches)</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((s) => (
                  <tr key={s.size} className="border-b border-line last:border-0">
                    <td className="py-3 pr-4">
                      <span className="rounded-lg bg-paper px-2.5 py-1 font-bold text-brand-navy">{s.size}</span>
                    </td>
                    <td className="py-3 pr-4 text-ink">{s.chest}</td>
                    <td className="py-3 pr-4 text-ink">{s.length}</td>
                    <td className="py-3 text-ink">{s.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-2xl bg-sky-50 p-4">
            <h3 className="text-sm font-bold text-brand-navy">Measurement Guide</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-ink-soft">
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong>Chest:</strong> Measure around the fullest part of your chest, under the arms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong>Length:</strong> Measure from the highest point of the shoulder to the bottom hem</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong>Shoulder:</strong> Measure from shoulder seam to shoulder seam across the back</span>
              </li>
            </ul>
          </div>

          <p className="mt-4 text-xs text-muted">
            All measurements are approximate. If you're between sizes, we recommend sizing up for a comfortable fit.
          </p>
        </div>
      </div>
    </div>
  );
}
