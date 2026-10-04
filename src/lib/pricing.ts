import { FALLBACK_BASE_FEE, FALLBACK_CART_CHAPTERS, FALLBACK_PG_BASE_FEE } from '@/data/site';
import type { CartChapter } from './cart';
import { isDemoMode, supabase } from './supabase';

export type ChapterPricing = CartChapter & { pgPrice: number };
export type Pricing = { baseFee: number; pgBaseFee: number; chapters: ChapterPricing[] };
export type Payee = { vpa: string; name: string };

/** Registration program. Each program has its own base fee and chapter prices, set in admin settings. */
export type Program = 'UG' | 'PG';
export const PROGRAM_LABELS: Record<Program, string> = { UG: 'Undergraduate', PG: 'Postgraduate' };

export function programOf(value?: string | null): Program {
  return value === 'PG' ? 'PG' : 'UG';
}

/** Base fee for the given program. */
export function programBaseFee(pricing: Pricing, program?: string | null): number {
  return program === 'PG' ? pricing.pgBaseFee : pricing.baseFee;
}

/** Chapter price for the given program. */
export function programChapterPrice(chapter: { price: number; pgPrice?: number | null }, program?: string | null): number {
  if (program === 'PG' && Number.isFinite(Number(chapter.pgPrice))) return Number(chapter.pgPrice);
  return chapter.price;
}

/** Pricing with the given program's fees resolved into plain cart chapters. */
export function resolveProgramPricing(pricing: Pricing, program?: string | null): { baseFee: number; chapters: CartChapter[] } {
  return {
    baseFee: programBaseFee(pricing, program),
    chapters: pricing.chapters.map((c) => ({ id: c.id, name: c.name, code: c.code, price: programChapterPrice(c, program) })),
  };
}

export const FALLBACK_PAYEE: Payee = { vpa: 'neharamiah2006-1@oksbi', name: 'Neha Ramiah' };

/** Demo-mode settings saved from /admin/settings. */
export type DemoSettings = { baseFee: number; pgBaseFee: number; vpa: string; payeeName: string; prices: Record<string, number>; pgPrices: Record<string, number> };
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

export const SENSORS_COUNCIL_UUID = '00000000-0000-0000-0000-00000000005c';
export const SENSORS_COUNCIL_CHAPTER: ChapterPricing = {
  id: SENSORS_COUNCIL_UUID,
  name: 'IEEE Sensors Council',
  code: 'SC',
  price: 0,
  pgPrice: 0,
};

/** Base fee and chapter prices per program: from Supabase in live mode, sample (or admin-edited) prices in demo mode. */
export async function loadPricing(): Promise<Pricing> {
  if (isDemoMode()) {
    const o = readDemoSettings();
    return {
      baseFee: o?.baseFee ?? FALLBACK_BASE_FEE,
      pgBaseFee: o?.pgBaseFee ?? FALLBACK_PG_BASE_FEE,
      chapters: FALLBACK_CART_CHAPTERS.map((c) => ({
        ...c,
        price: o?.prices[c.id] ?? c.price,
        pgPrice: o?.pgPrices?.[c.id] ?? c.pgPrice,
      })),
    };
  }
  const [chaptersRes, configRes] = await Promise.all([
    supabase.from('chapters').select('id, name, code, price, pg_price').eq('is_active', true).order('display_order'),
    supabase.from('membership_config').select('base_fee, pg_base_fee').eq('id', 1).maybeSingle(),
  ]);
  if (chaptersRes.error || configRes.error || !configRes.data) {
    throw new Error('Membership pricing is not available right now. Please try again later or contact the branch.');
  }
  const list: ChapterPricing[] = (chaptersRes.data ?? []).map((c) => ({ id: c.id, name: c.name, code: c.code, price: Number(c.price), pgPrice: Number(c.pg_price ?? c.price) }));
  if (!list.some((c) => c.code === 'SC')) {
    const ssitIndex = list.findIndex((c) => c.code === 'SSIT');
    if (ssitIndex >= 0) {
      list.splice(ssitIndex, 0, SENSORS_COUNCIL_CHAPTER);
    } else {
      list.push(SENSORS_COUNCIL_CHAPTER);
    }
  }
  return {
    baseFee: Number(configRes.data.base_fee),
    pgBaseFee: Number(configRes.data.pg_base_fee ?? configRes.data.base_fee),
    chapters: list,
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
