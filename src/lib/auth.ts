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
const DUMMY_ORDERS_KEY = 'bmsce_dummy_orders';
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
    base_fee: 250, total_amount: 450, utr_reference: '423984572910', order_reference: 'BMSCE-X8K92A',
    payment_screenshot_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    status: 'pending', created_at: hoursAgo(2), chapters: ['Computer Society', 'Power & Energy Society'],
  },
  {
    id: 'ord-demo-002', user_id: 'user-sample-02', student_name: 'Pooja Hegde', usn: '1BM23EC042',
    email: 'pooja.ec23@bmsce.ac.in', department: 'ECE', year_of_study: '3', phone: '+91 9741098765',
    base_fee: 250, total_amount: 300, utr_reference: '423910293847', order_reference: 'BMSCE-P4M19Q',
    payment_screenshot_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
    status: 'pending', created_at: hoursAgo(6), chapters: ['Women in Engineering'],
  },
  {
    id: 'ord-demo-003', user_id: 'user-sample-03', student_name: 'Karthik Rao', usn: '1BM22IS035',
    email: 'karthik.is22@bmsce.ac.in', department: 'ISE', year_of_study: '3', phone: '+91 9448011223',
    base_fee: 250, total_amount: 350, utr_reference: '423891029384', order_reference: 'BMSCE-Z7T33K',
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
