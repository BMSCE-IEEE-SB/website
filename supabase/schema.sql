-- BMSCE IEEE Student Branch - database schema
-- Run this once in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  usn text not null,
  email text not null,
  department text not null,
  year_of_study text,
  phone text,
  ieee_member_id text,
  created_at timestamptz default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  price numeric not null check (price >= 0),
  description text
);

create table if not exists membership_config (
  id int primary key default 1 check (id = 1),
  base_fee numeric not null,
  payee_vpa text not null,
  payee_name text not null
);

create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'admin'
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  base_fee numeric not null,
  total_amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  payment_screenshot_url text,          -- storage path inside the private 'public-assets' bucket
  utr_reference text,
  order_reference text unique not null,
  created_at timestamptz default now(),
  verified_at timestamptz,
  verified_by uuid references admins(id),
  rejection_reason text
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  chapter_id uuid references chapters(id) not null,
  price_at_purchase numeric not null
);

-- The site-wide announcement banner (single row, id = 1).
create table if not exists announcement (
  id int primary key default 1 check (id = 1),
  message text not null,
  link_url text,
  is_active boolean not null default true,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Seed data (edit prices / UPI ID before going live)
-- ---------------------------------------------------------------------------

insert into membership_config (id, base_fee, payee_vpa, payee_name)
values (1, 1810, 'bmsceieee@okhdfcbank', 'BMSCE IEEE Student Branch')
on conflict (id) do nothing;

insert into chapters (name, code, price) values
  ('Computer Society', 'CS', 100),
  ('Power & Energy Society', 'PES', 100),
  ('PELS & IES Joint Chapter', 'PELS/IES', 100),
  ('Robotics & Automation Society', 'RAS', 100),
  ('Women in Engineering', 'WIE', 50),
  ('Social Implications of Technology', 'SSIT', 50)
on conflict (code) do nothing;

insert into announcement (id, message, link_url, is_active)
values (1, 'Membership Drive 2026 is live. Register today to join IEEE and its technical chapters.', '/membership', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where id = auth.uid());
$$;

alter table profiles enable row level security;
alter table chapters enable row level security;
alter table membership_config enable row level security;
alter table admins enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table announcement enable row level security;

-- Public read-only data
create policy "chapters are public" on chapters for select using (true);
create policy "config is public" on membership_config for select using (true);
create policy "announcement is public" on announcement for select using (true);
create policy "admins manage announcement" on announcement for all using (is_admin()) with check (is_admin());

-- Admin table: a user may check their own admin row
create policy "read own admin row" on admins for select using (id = auth.uid());

-- Profiles
create policy "members manage own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "admins read profiles" on profiles for select using (is_admin());

-- Orders: members create and read their own; they may only resubmit a rejected order
create policy "members read own orders" on orders for select using (user_id = auth.uid());
create policy "members create own orders" on orders for insert with check (user_id = auth.uid() and status = 'pending');
create policy "members resubmit rejected orders" on orders for update
  using (user_id = auth.uid() and status = 'rejected')
  with check (user_id = auth.uid() and status = 'pending');
create policy "admins manage orders" on orders for all using (is_admin()) with check (is_admin());

create policy "members read own items" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "members add items to own orders" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "admins read items" on order_items for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Storage: payment screenshots live in a PRIVATE bucket.
-- Create the bucket first: Storage -> New bucket -> name 'public-assets', Public OFF.
-- ---------------------------------------------------------------------------

create policy "members upload own proofs" on storage.objects for insert
  with check (bucket_id = 'public-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members update own proofs" on storage.objects for update
  using (bucket_id = 'public-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members read own proofs" on storage.objects for select
  using (bucket_id = 'public-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "admins read all proofs" on storage.objects for select
  using (bucket_id = 'public-assets' and is_admin());

-- To make someone an admin, after they sign up once:
--   insert into admins (id, full_name) select id, 'Branch Chair' from auth.users where email = 'chair@bmsce.ac.in';
