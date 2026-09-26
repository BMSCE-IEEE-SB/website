import { isDemoMode, supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  usn?: string;
  department?: string;
  year_of_study?: string;
  phone?: string;
  ieee_member_id?: string;
}

export type OrderStatus = 'pending' | 'verified' | 'rejected';

export interface Order {
  id: string;
  user_id: string;
  base_fee: number;
  total_amount: number;
  payment_screenshot_url?: string;
  utr_reference?: string;
  order_reference: string;
  status: OrderStatus;
  created_at: string;
  verified_at?: string;
  rejection_reason?: string;
  chapters?: string[];
  /** Admin-only fields */
  admin_note?: string;
  credentials_sent_at?: string;
  ieee_member_id?: string;
  student_name?: string;
  usn?: string;
  email?: string;
  department?: string;
  year_of_study?: string;
  phone?: string;
}

export interface Announcement {
  id?: number;
  message: string;
  link_url?: string;
  is_active: boolean;
  updated_at?: string;
}

export interface SessionUser {
  id: string;
  email: string;
}

export const DUMMY_CREDENTIALS = { email: 'test@bmsce.ac.in', password: 'password123' };
export const DUMMY_ADMIN_CREDENTIALS = { email: 'admin@bmsce.ac.in', password: 'adminpassword' };

const DUMMY_USER_KEY = 'bmsce_dummy_user';
const DUMMY_ADMIN_KEY = 'bmsce_dummy_admin';
const DUMMY_PROFILE_KEY = 'bmsce_dummy_profiles';
const DUMMY_ORDERS_KEY = 'bmsce_dummy_orders_v3';
const ANNOUNCEMENT_KEY = 'bmsce_announcement';

const isBrowser = () => typeof window !== 'undefined';

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Usually QuotaExceededError from a large screenshot.
    throw new Error('Your browser storage is full. Clear site data and try again.', { cause: err });
  }
}

/** Same email always maps to the same demo user id, so orders stay linked to their owner. */
function demoUserId(email: string) {
  let h = 0;
  for (const ch of email.trim().toLowerCase()) h = (Math.imul(31, h) + ch.charCodeAt(0)) | 0;
  return `demo-usr-${(h >>> 0).toString(36)}`;
}

// ---------------------------------------------------------------------------
// Member session
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isDemoMode()) return readJson<SessionUser | null>(DUMMY_USER_KEY, null);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? '' } : null;
}

export function setDummySession(email: string = DUMMY_CREDENTIALS.email): SessionUser | null {
  if (!isDemoMode() || !isBrowser()) return null;
  const user = { id: demoUserId(email), email: email.trim().toLowerCase() };
  writeJson(DUMMY_USER_KEY, user);
  window.dispatchEvent(new Event('bmsce-auth-change'));
  return user;
}

export async function clearUserSession() {
  if (isBrowser()) localStorage.removeItem(DUMMY_USER_KEY);
  if (!isDemoMode()) await supabase.auth.signOut().catch(() => {});
  if (isBrowser()) window.dispatchEvent(new Event('bmsce-auth-change'));
}

// ---------------------------------------------------------------------------
// Admin session
// ---------------------------------------------------------------------------

export async function getAdminUser(): Promise<(SessionUser & { role: string }) | null> {
  if (isDemoMode()) return readJson(DUMMY_ADMIN_KEY, null);
  // Live mode: admin rights come only from the `admins` table, never from localStorage.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: adminRecord } = await supabase.from('admins').select('role').eq('id', user.id).maybeSingle();
  return adminRecord ? { id: user.id, email: user.email ?? '', role: adminRecord.role ?? 'admin' } : null;
}

export function setDummyAdminSession(email: string = DUMMY_ADMIN_CREDENTIALS.email) {
  if (!isDemoMode() || !isBrowser()) return null;
  const admin = { id: 'demo-admin-001', email, role: 'admin' };
  writeJson(DUMMY_ADMIN_KEY, admin);
  return admin;
}

export async function clearAdminSession() {
  if (isBrowser()) localStorage.removeItem(DUMMY_ADMIN_KEY);
  if (!isDemoMode()) await supabase.auth.signOut().catch(() => {});
}

// ---------------------------------------------------------------------------
// Demo-mode profile & order storage
// ---------------------------------------------------------------------------

export function saveLocalProfile(profile: UserProfile) {
  const all = readJson<Record<string, UserProfile>>(DUMMY_PROFILE_KEY, {});
  all[profile.id] = profile;
  writeJson(DUMMY_PROFILE_KEY, all);
  window.dispatchEvent(new Event('bmsce-auth-change'));
}

export function getLocalProfile(userId: string): UserProfile | null {
  return readJson<Record<string, UserProfile>>(DUMMY_PROFILE_KEY, {})[userId] ?? null;
}

// ---------------------------------------------------------------------------
// Demo sample data: ~45 applications over the last five weeks so the admin
// dashboard has something realistic to show. Deterministic (seeded).
// ---------------------------------------------------------------------------

function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Aarav', 'Ananya', 'Rohan', 'Diya', 'Karthik', 'Meera', 'Vikram', 'Sneha', 'Aditya', 'Isha', 'Rahul', 'Pooja', 'Nikhil', 'Kavya', 'Arjun', 'Riya', 'Siddharth', 'Tanvi', 'Harsh', 'Nandini', 'Pranav', 'Shreya', 'Varun', 'Aditi'];
const LAST = ['Sharma', 'Rao', 'Iyer', 'Hegde', 'Nair', 'Reddy', 'Kulkarni', 'Patil', 'Menon', 'Shetty', 'Bhat', 'Gowda', 'Joshi', 'Kamath', 'Pai', 'Desai'];
const DEPT_MIX: [string, string][] = [['CSE', 'CS'], ['CSE', 'CS'], ['ISE', 'IS'], ['AIML', 'AI'], ['ECE', 'EC'], ['ECE', 'EC'], ['EEE', 'EE'], ['MECH', 'ME'], ['CIVIL', 'CV'], ['ETE', 'ET']];
const CHAPTER_PRICES: [string, number][] = [
  ['Computer Society', 100], ['Power & Energy Society', 100], ['PELS & IES Joint Chapter', 100],
  ['Robotics & Automation Society', 100], ['Women in Engineering', 50], ['Social Implications of Technology', 50],
];
const DEPT_CHAPTERS: Record<string, number[]> = { CSE: [0, 5, 4], ISE: [0, 5], AIML: [0, 3], ECE: [2, 3, 4], EEE: [1, 2], MECH: [3, 1], CIVIL: [5, 1], ETE: [2, 0] };
const PROOFS = [
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
];

function buildSampleOrders(): Order[] {
  const rand = seeded(2026);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const now = Date.now();
  const out: Order[] = [];
  const REFS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 46; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const [dept, code] = pick(DEPT_MIX);
    const year = String(1 + Math.floor(rand() * 4));
    const batch = String(26 - Number(year));
    // Skew towards recent days to look like a drive in progress.
    const daysAgo = Math.floor(Math.pow(rand(), 1.6) * 34);
    const created = now - daysAgo * 86400000 - Math.floor(rand() * 20) * 3600000;
    const chapterIdx = (DEPT_CHAPTERS[dept] ?? [0]).filter(() => rand() < 0.55);
    const chapters = chapterIdx.map((k) => CHAPTER_PRICES[k][0]);
    const total = 1810 + chapterIdx.reduce((sum, k) => sum + CHAPTER_PRICES[k][1], 0);
    const age = (now - created) / 86400000;
    const r = rand();
    const status: OrderStatus = age < 3 ? (r < 0.85 ? 'pending' : 'verified') : r < 0.12 ? 'rejected' : r < 0.2 && age < 9 ? 'pending' : 'verified';
    const verifiedAt = status === 'verified' ? new Date(created + (6 + Math.floor(rand() * 60)) * 3600000).toISOString() : undefined;
    out.push({
      id: `ord-sample-${String(i + 1).padStart(3, '0')}`,
      user_id: `user-sample-${String(i + 1).padStart(3, '0')}`,
      student_name: `${first} ${last}`,
      usn: `1BM${batch}${code}${String(Math.floor(rand() * 180) + 1).padStart(3, '0')}`,
      email: `${first.toLowerCase()}.${code.toLowerCase()}${batch}@bmsce.ac.in`,
      department: dept,
      year_of_study: year,
      phone: `+91 9${Math.floor(100000000 + rand() * 899999999)}`,
      base_fee: 1810,
      total_amount: total,
      payment_screenshot_url: pick(PROOFS),
      utr_reference: String(Math.floor(400000000000 + rand() * 99999999999)),
      order_reference: 'BMSCE-' + Array.from({ length: 6 }, () => REFS[Math.floor(rand() * REFS.length)]).join(''),
      status,
      created_at: new Date(created).toISOString(),
      verified_at: verifiedAt,
      rejection_reason: status === 'rejected' ? 'The screenshot is cropped and the UTR is not visible.' : undefined,
      credentials_sent_at: status === 'verified' && age > 20 && rand() < 0.7 ? new Date(created + 10 * 86400000).toISOString() : undefined,
      chapters,
    });
  }
  // Two deliberate problems so the review tools have something to catch:
  const pend = out.filter((o) => o.status === 'pending');
  if (pend.length >= 2) {
    pend[1].utr_reference = out.find((o) => o.status === 'verified')?.utr_reference; // re-used UTR
    pend[0].total_amount = pend[0].total_amount - 100; // paid less than the total
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** All demo orders (admin view). Samples are seeded once, not every time the list is empty. */
export function getLocalOrders(): Order[] {
  if (!isBrowser()) return [];
  if (localStorage.getItem(DUMMY_ORDERS_KEY) === null) writeJson(DUMMY_ORDERS_KEY, buildSampleOrders());
  const orders = readJson<Order[]>(DUMMY_ORDERS_KEY, []);
  return Array.isArray(orders) ? orders : [];
}

/** Only the orders that belong to this member. */
export function getLocalOrdersForUser(userId: string): Order[] {
  return getLocalOrders().filter((o) => o.user_id === userId);
}

export function saveLocalOrder(order: Order) {
  const profile = getLocalProfile(order.user_id);
  const enriched: Order = {
    ...order,
    student_name: profile?.full_name ?? order.student_name,
    usn: profile?.usn ?? order.usn,
    email: profile?.email ?? order.email,
    department: profile?.department ?? order.department,
    year_of_study: profile?.year_of_study ?? order.year_of_study,
    phone: profile?.phone ?? order.phone,
  };
  writeJson(DUMMY_ORDERS_KEY, [enriched, ...getLocalOrders().filter((o) => o.id !== order.id)]);
}

/** Replace the whole demo order list (used by admin bulk actions). */
export function writeLocalOrders(orders: Order[]) {
  writeJson(DUMMY_ORDERS_KEY, orders);
}

function patchLocalOrder(orderId: string, patch: (o: Order) => Order) {
  const updated = getLocalOrders().map((o) => (o.id === orderId ? patch(o) : o));
  writeJson(DUMMY_ORDERS_KEY, updated);
  return updated.find((o) => o.id === orderId) ?? null;
}

export function updateLocalOrderStatus(orderId: string, status: 'verified' | 'rejected', rejectionReason?: string) {
  return patchLocalOrder(orderId, (o) => ({
    ...o,
    status,
    verified_at: status === 'verified' ? new Date().toISOString() : undefined,
    rejection_reason: status === 'rejected' ? rejectionReason : undefined,
  }));
}

export function resubmitLocalOrderProof(orderId: string, screenshotUrl: string, utrReference?: string) {
  return patchLocalOrder(orderId, (o) => ({
    ...o,
    status: 'pending',
    payment_screenshot_url: screenshotUrl,
    utr_reference: utrReference || o.utr_reference,
    rejection_reason: undefined,
  }));
}

// ---------------------------------------------------------------------------
// Announcement banner
// ---------------------------------------------------------------------------

export const DEFAULT_ANNOUNCEMENT: Announcement = {
  message: 'Membership Drive 2026 is live. Register today to join IEEE and its technical chapters.',
  link_url: '/membership',
  is_active: true,
};

export function getLocalAnnouncement(): Announcement {
  return readJson<Announcement>(ANNOUNCEMENT_KEY, DEFAULT_ANNOUNCEMENT);
}

export function saveLocalAnnouncement(announcement: Announcement) {
  writeJson(ANNOUNCEMENT_KEY, announcement);
}

export async function loadAnnouncement(): Promise<Announcement | null> {
  if (isDemoMode()) return getLocalAnnouncement();
  const { data } = await supabase.from('announcement').select('*').eq('id', 1).maybeSingle();
  return data ?? null;
}
