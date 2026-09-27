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
  receipt_number?: string;
  tshirt_size?: string;
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
  receipt_sent?: boolean;
  receipt_sent_at?: string;
  receipt_error?: string;
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
  ['Women in Engineering', 50], ['Social Implications of Technology', 50],
];
const DEPT_CHAPTERS: Record<string, number[]> = { CSE: [0, 4, 3], ISE: [0, 4], AIML: [0, 3], ECE: [2, 1, 3], EEE: [1, 2], MECH: [2, 1], CIVIL: [4, 1], ETE: [2, 0] };
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

export function updateLocalOrderReceipt(orderId: string, receipt_sent: boolean, receipt_number?: string, receipt_error?: string) {
  return patchLocalOrder(orderId, (o) => ({
    ...o,
    receipt_sent,
    receipt_sent_at: receipt_sent ? new Date().toISOString() : o.receipt_sent_at,
    receipt_number: receipt_number ?? o.receipt_number,
    receipt_error: receipt_error ?? undefined,
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

// ---------------------------------------------------------------------------
// Settings & Pricing (Membership Drive Configuration & Chapter Prices)
// ---------------------------------------------------------------------------

export interface MembershipSettings {
  base_fee: number;
  payee_vpa: string;
  payee_name: string;
  drive_year: number;
  is_drive_open: boolean;
  treasurer_name?: string;
  treasurer_role?: string;
  treasurer_phone?: string;
  signature_url?: string;
}

export interface ChapterSetting {
  id: string;
  name: string;
  code: string;
  slug?: string;
  price: number;
  description?: string;
  is_active: boolean;
  display_order?: number;
}

const SETTINGS_KEY = 'bmsce_settings';
const CHAPTERS_KEY = 'bmsce_admin_chapters';

export const DEFAULT_SETTINGS: MembershipSettings = {
  base_fee: 1810,
  payee_vpa: 'bmsceieee@okhdfcbank',
  payee_name: 'BMSCE IEEE Student Branch',
  drive_year: 2026,
  is_drive_open: true,
  treasurer_name: 'Neha Ramiah',
  treasurer_role: 'Treasurer and MDC',
  treasurer_phone: '+91 6385525264',
};

export const DEFAULT_CHAPTER_SETTINGS: ChapterSetting[] = [
  { id: 'cs', name: 'IEEE Computer Society', code: 'CS', slug: 'cs', price: 100, is_active: true, display_order: 1 },
  { id: 'pes', name: 'IEEE Power & Energy Society', code: 'PES', slug: 'pes', price: 100, is_active: true, display_order: 2 },
  { id: 'pels-ies', name: 'IEEE Power & Industrial Electronics Joint Chapter', code: 'PELS/IES', slug: 'pels-ies', price: 100, is_active: true, display_order: 3 },
  { id: 'wie', name: 'IEEE Women in Engineering', code: 'WIE', slug: 'wie', price: 50, is_active: true, display_order: 4 },
  { id: 'ssit', name: 'IEEE Social Implications of Technology', code: 'SSIT', slug: 'ssit', price: 50, is_active: true, display_order: 5 },
];

export async function loadAdminSettings(): Promise<MembershipSettings> {
  if (isDemoMode()) return readJson(SETTINGS_KEY, DEFAULT_SETTINGS);
  const { data } = await supabase
    .from('membership_config')
    .select('base_fee, payee_vpa, payee_name, drive_year, is_drive_open, treasurer_name, treasurer_role, treasurer_phone, signature_url')
    .eq('id', 1)
    .maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return {
    base_fee: Number(data.base_fee),
    payee_vpa: data.payee_vpa,
    payee_name: data.payee_name,
    drive_year: data.drive_year ?? 2026,
    is_drive_open: data.is_drive_open ?? true,
    treasurer_name: data.treasurer_name || DEFAULT_SETTINGS.treasurer_name,
    treasurer_role: data.treasurer_role || DEFAULT_SETTINGS.treasurer_role,
    treasurer_phone: data.treasurer_phone || DEFAULT_SETTINGS.treasurer_phone,
    signature_url: data.signature_url || undefined,
  };
}

export async function saveAdminSettings(settings: MembershipSettings) {
  if (isDemoMode()) {
    writeJson(SETTINGS_KEY, settings);
    return;
  }
  const { error } = await supabase.from('membership_config').upsert({ id: 1, ...settings });
  if (error) throw error;
}

export async function loadAdminChapters(): Promise<ChapterSetting[]> {
  if (isDemoMode()) return readJson(CHAPTERS_KEY, DEFAULT_CHAPTER_SETTINGS);
  const { data, error } = await supabase.from('chapters').select('id, name, code, slug, price, description, is_active, display_order').order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    ...c,
    price: Number(c.price),
    is_active: c.is_active ?? true,
  }));
}

export async function saveAdminChapter(chapter: ChapterSetting) {
  if (isDemoMode()) {
    const prev = await loadAdminChapters();
    const next = prev.map((c) => (c.id === chapter.id ? chapter : c));
    writeJson(CHAPTERS_KEY, next);
    return;
  }
  const { error } = await supabase.from('chapters').update({
    name: chapter.name,
    price: chapter.price,
    is_active: chapter.is_active,
  }).eq('id', chapter.id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Dynamic Events Management
// ---------------------------------------------------------------------------

export interface AdminEvent {
  id: string;
  title: string;
  category: 'workshop' | 'hackathon' | 'summit' | 'talk';
  chapter: string;
  date: string;
  time?: string;
  venue: string;
  image: string;
  description: string;
  registration_url?: string;
  is_featured?: boolean;
}

const EVENTS_KEY = 'bmsce_admin_events';

export async function loadAdminEvents(): Promise<AdminEvent[]> {
  if (isDemoMode()) {
    return readJson(EVENTS_KEY, [
      {
        id: 'ieee-day-2026',
        title: 'IEEE Day Celebrations 2026',
        category: 'summit',
        chapter: 'branch',
        date: '2026-10-06',
        time: '10:00',
        venue: 'BMSCE Main Auditorium',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&h=600&fit=crop&auto=format&q=70',
        description: 'A day of technical talks, member recognition and demos celebrating IEEE members around the world.',
        registration_url: '#',
        is_featured: true,
      },
      {
        id: 'xtreme-2026',
        title: 'IEEEXtreme 20.0',
        category: 'hackathon',
        chapter: 'cs',
        date: '2026-10-24',
        time: '05:30',
        venue: 'CSE Labs, PJA Block',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&h=600&fit=crop&auto=format&q=70',
        description: 'The global 24-hour IEEE programming competition, hosted on campus for BMSCE teams.',
        registration_url: '#',
        is_featured: true,
      },
    ]);
  }
  const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminEvent[];
}

export async function saveAdminEvent(event: AdminEvent) {
  if (isDemoMode()) {
    const list = await loadAdminEvents();
    const existing = list.findIndex((e) => e.id === event.id);
    if (existing >= 0) list[existing] = event;
    else list.unshift(event);
    writeJson(EVENTS_KEY, list);
    return;
  }
  const { error } = await supabase.from('events').upsert(event);
  if (error) throw error;
}

export async function deleteAdminEvent(eventId: string) {
  if (isDemoMode()) {
    const list = await loadAdminEvents();
    writeJson(EVENTS_KEY, list.filter((e) => e.id !== eventId));
    return;
  }
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Admin Team Management (Whitelist & Active Admins)
// ---------------------------------------------------------------------------

export interface AdminWhitelistEntry {
  email: string;
  role: string;
  created_at?: string;
}

const WHITELIST_KEY = 'bmsce_admin_whitelist';

export async function loadAdminWhitelist(): Promise<AdminWhitelistEntry[]> {
  if (isDemoMode()) {
    return readJson(WHITELIST_KEY, [
      { email: 'ratikagrawal.ec24@bmsce.ac.in', role: 'chair', created_at: new Date().toISOString() },
      { email: 'bms.ieeesb@gmail.com', role: 'admin', created_at: new Date().toISOString() },
    ]);
  }
  const { data, error } = await supabase.from('admin_whitelist').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminWhitelistEntry[];
}

export async function addAdminWhitelistEntry(email: string, role = 'admin') {
  const cleanEmail = email.trim().toLowerCase();
  if (isDemoMode()) {
    const list = await loadAdminWhitelist();
    if (!list.some((a) => a.email === cleanEmail)) {
      list.push({ email: cleanEmail, role, created_at: new Date().toISOString() });
      writeJson(WHITELIST_KEY, list);
    }
    return;
  }
  const { error } = await supabase.from('admin_whitelist').upsert({ email: cleanEmail, role });
  if (error) throw error;
}

export async function removeAdminWhitelistEntry(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (isDemoMode()) {
    const list = await loadAdminWhitelist();
    writeJson(WHITELIST_KEY, list.filter((a) => a.email !== cleanEmail));
    return;
  }
  const { error } = await supabase.from('admin_whitelist').delete().eq('email', cleanEmail);
  if (error) throw error;
}
