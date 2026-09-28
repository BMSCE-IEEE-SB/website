import { FALLBACK_BASE_FEE, FALLBACK_CART_CHAPTERS } from '@/data/site';
import type { CartChapter } from './cart';
import { isDemoMode, supabase } from './supabase';

export type Pricing = { baseFee: number; chapters: CartChapter[] };
export type Payee = { vpa: string; name: string };

export const FALLBACK_PAYEE: Payee = { vpa: 'neharamiah2006-1@oksbi', name: 'BMSCE IEEE Student Branch' };

/** Demo-mode settings saved from /admin/settings. */
export type DemoSettings = { baseFee: number; vpa: string; payeeName: string; prices: Record<string, number> };
export const DEMO_SETTINGS_KEY = 'bmsce_demo_settings';

export function readDemoSettings(): DemoSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEMO_SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as DemoSettings) : null;
  } catch {
    return null;
  }
}

/** Base fee and chapter prices: from Supabase in live mode, sample (or admin-edited) prices in demo mode. */
export async function loadPricing(): Promise<Pricing> {
  if (isDemoMode()) {
    const o = readDemoSettings();
    return {
      baseFee: o?.baseFee ?? FALLBACK_BASE_FEE,
      chapters: FALLBACK_CART_CHAPTERS.map((c) => ({ ...c, price: o?.prices[c.id] ?? c.price })),
    };
  }
  const [chaptersRes, configRes] = await Promise.all([
    supabase.from('chapters').select('id, name, code, price').eq('is_active', true).order('display_order'),
    supabase.from('membership_config').select('base_fee').eq('id', 1).maybeSingle(),
  ]);
  if (chaptersRes.error || configRes.error || !configRes.data) {
    throw new Error('Membership pricing is not available right now. Please try again later or contact the branch.');
  }
  return {
    baseFee: Number(configRes.data.base_fee),
    chapters: (chaptersRes.data ?? []).map((c) => ({ ...c, price: Number(c.price) })),
  };
}

/** Who students pay: the UPI ID and payee name shown at checkout. */
export async function loadPayee(): Promise<Payee> {
  if (isDemoMode()) {
    const o = readDemoSettings();
    return { vpa: o?.vpa || FALLBACK_PAYEE.vpa, name: o?.payeeName || FALLBACK_PAYEE.name };
  }
  const { data } = await supabase.from('membership_config').select('payee_vpa, payee_name').eq('id', 1).maybeSingle();
  return { vpa: data?.payee_vpa || FALLBACK_PAYEE.vpa, name: data?.payee_name || FALLBACK_PAYEE.name };
}
