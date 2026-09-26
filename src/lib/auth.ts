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
const DUMMY_ORDERS_KEY = 'bmsce_dummy_orders_v2';
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

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-demo-001', user_id: 'user-sample-01', student_name: 'Rahul Varma', usn: '1BM23CS084',
    email: 'rahul.cs23@bmsce.ac.in', department: 'CSE', year_of_study: '2', phone: '+91 9845012345',
    base_fee: 1810, total_amount: 2010, utr_reference: '423984572910', order_reference: 'BMSCE-X8K92A',
    payment_screenshot_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    status: 'pending', created_at: hoursAgo(2), chapters: ['Computer Society', 'Power & Energy Society'],
  },
  {
    id: 'ord-demo-002', user_id: 'user-sample-02', student_name: 'Pooja Hegde', usn: '1BM23EC042',
    email: 'pooja.ec23@bmsce.ac.in', department: 'ECE', year_of_study: '3', phone: '+91 9741098765',
    base_fee: 1810, total_amount: 1860, utr_reference: '423910293847', order_reference: 'BMSCE-P4M19Q',
    payment_screenshot_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
    status: 'pending', created_at: hoursAgo(6), chapters: ['Women in Engineering'],
  },
  {
    id: 'ord-demo-003', user_id: 'user-sample-03', student_name: 'Karthik Rao', usn: '1BM22IS035',
    email: 'karthik.is22@bmsce.ac.in', department: 'ISE', year_of_study: '3', phone: '+91 9448011223',
    base_fee: 1810, total_amount: 1910, utr_reference: '423891029384', order_reference: 'BMSCE-Z7T33K',
    payment_screenshot_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    status: 'verified', created_at: hoursAgo(24), verified_at: hoursAgo(12), chapters: ['Computer Society'],
  },
];

/** All demo orders (admin view). Samples are seeded once, not every time the list is empty. */
export function getLocalOrders(): Order[] {
  if (!isBrowser()) return [];
  if (localStorage.getItem(DUMMY_ORDERS_KEY) === null) writeJson(DUMMY_ORDERS_KEY, SAMPLE_ORDERS);
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

// ---------------------------------------------------------------------------
// Settings & Pricing (Membership Drive Configuration & Chapter Prices)
// ---------------------------------------------------------------------------

export interface MembershipSettings {
  base_fee: number;
  payee_vpa: string;
  payee_name: string;
  drive_year: number;
  is_drive_open: boolean;
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
};

export const DEFAULT_CHAPTER_SETTINGS: ChapterSetting[] = [
  { id: 'cs', name: 'IEEE Computer Society', code: 'CS', slug: 'cs', price: 100, is_active: true, display_order: 1 },
  { id: 'pes', name: 'IEEE Power & Energy Society', code: 'PES', slug: 'pes', price: 100, is_active: true, display_order: 2 },
  { id: 'pels-ies', name: 'IEEE Power & Industrial Electronics Joint Chapter', code: 'PELS/IES', slug: 'pels-ies', price: 100, is_active: true, display_order: 3 },
  { id: 'ras', name: 'IEEE Robotics & Automation Society', code: 'RAS', slug: 'ras', price: 100, is_active: true, display_order: 4 },
  { id: 'wie', name: 'IEEE Women in Engineering', code: 'WIE', slug: 'wie', price: 50, is_active: true, display_order: 5 },
  { id: 'ssit', name: 'IEEE Social Implications of Technology', code: 'SSIT', slug: 'ssit', price: 50, is_active: true, display_order: 6 },
];

export async function loadAdminSettings(): Promise<MembershipSettings> {
  if (isDemoMode()) return readJson(SETTINGS_KEY, DEFAULT_SETTINGS);
  const { data } = await supabase.from('membership_config').select('base_fee, payee_vpa, payee_name, drive_year, is_drive_open').eq('id', 1).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return {
    base_fee: Number(data.base_fee),
    payee_vpa: data.payee_vpa,
    payee_name: data.payee_name,
    drive_year: data.drive_year ?? 2026,
    is_drive_open: data.is_drive_open ?? true,
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

