-- BMSCE IEEE Student Branch - Complete Database Schema
-- Run this once in the Supabase SQL editor or via Supabase migrations.
-- Then apply every ordered SQL file in supabase/migrations/. The security
-- remediation migration is mandatory for both fresh and existing projects;
-- it preserves existing rows and moves privileged writes to server routes.

-- ---------------------------------------------------------------------------
-- 1. Core Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  usn text NOT NULL,
  email text NOT NULL,
  department text NOT NULL,
  year_of_study text,
  phone text,
  ieee_member_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  slug text,
  price numeric NOT NULL CHECK (price >= 0),
  description text,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.membership_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_fee numeric NOT NULL,
  payee_vpa text NOT NULL,
  payee_name text NOT NULL,
  drive_year int DEFAULT 2026,
  is_drive_open boolean DEFAULT true,
  treasurer_name text DEFAULT 'Neha Ramiah',
  treasurer_role text DEFAULT 'Treasurer and MDC',
  treasurer_phone text DEFAULT '+91 6385525264',
  signature_url text
);

CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS public.admin_whitelist (
  email text PRIMARY KEY,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  base_fee numeric NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  payment_screenshot_url text,          -- storage path inside private 'public-assets' bucket
  utr_reference text,
  order_reference text UNIQUE NOT NULL,
  receipt_number text UNIQUE,
  drive_year int DEFAULT 2026,
  tshirt_size text,
  receipt_sent boolean DEFAULT false,
  receipt_sent_at timestamptz,
  receipt_error text,
  admin_note text,
  credentials_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES public.admins(id),
  rejection_reason text
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES public.chapters(id) NOT NULL,
  price_at_purchase numeric NOT NULL
);

-- Audit trail of admin actions
CREATE TABLE IF NOT EXISTS public.admin_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admins(id),
  admin_email text,
  action text NOT NULL,
  target text,
  details text,
  created_at timestamptz DEFAULT now()
);

-- Site-wide announcement banner (single row, id = 1)
CREATE TABLE IF NOT EXISTS public.announcement (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  message text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Events & workshops table
CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('workshop', 'hackathon', 'summit', 'talk')),
  chapter text NOT NULL,
  date date NOT NULL,
  time text,
  venue text NOT NULL,
  image text NOT NULL,
  description text NOT NULL,
  registration_url text DEFAULT '#',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Seed Data
-- ---------------------------------------------------------------------------

INSERT INTO public.membership_config (id, base_fee, payee_vpa, payee_name, drive_year, is_drive_open, treasurer_name, treasurer_role, treasurer_phone)
VALUES (1, 1810, 'bmsceieee@okhdfcbank', 'BMSCE IEEE Student Branch', 2026, true, 'Neha Ramiah', 'Treasurer and MDC', '+91 6385525264')
ON CONFLICT (id) DO UPDATE SET
  base_fee = EXCLUDED.base_fee,
  payee_vpa = EXCLUDED.payee_vpa,
  payee_name = EXCLUDED.payee_name,
  drive_year = EXCLUDED.drive_year,
  is_drive_open = EXCLUDED.is_drive_open,
  treasurer_name = EXCLUDED.treasurer_name,
  treasurer_role = EXCLUDED.treasurer_role,
  treasurer_phone = EXCLUDED.treasurer_phone;

INSERT INTO public.chapters (name, code, slug, price, description, is_active, display_order) VALUES
  ('IEEE Computer Society', 'CS', 'cs', 100, 'Focus on software architectures, algorithms, AI systems & IEEEXtreme programming competition.', true, 1),
  ('IEEE Power & Energy Society', 'PES', 'pes', 100, 'Clean technology, microgrids, electric vehicles, and renewable power infrastructure.', true, 2),
  ('IEEE Power & Industrial Electronics Joint Chapter', 'PELS/IES', 'pels-ies', 100, 'Hands-on hardware, power drives, PCB fabrication, and industrial automation systems.', true, 3),
  ('IEEE Women in Engineering', 'WIE', 'wie', 0, 'Global network dedicated to promoting women engineers and scientists, leadership & STEM mentorship.', true, 4),
  ('IEEE Social Implications of Technology', 'SSIT', 'ssit', 50, 'Exploring ethical, legal, environmental, and humanitarian impacts of emerging technologies.', true, 5)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

DELETE FROM public.chapters WHERE code NOT IN ('CS', 'PES', 'PELS/IES', 'WIE', 'SSIT');

INSERT INTO public.announcement (id, message, link_url, is_active)
VALUES (1, 'Membership Drive 2026 is live. Register today to join IEEE and its technical chapters.', '/membership', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_whitelist (email, role)
VALUES 
  ('ratikagrawal.ec24@bmsce.ac.in', 'chair'),
  ('bms.ieeesb@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.events (id, title, category, chapter, date, time, venue, image, description, registration_url, is_featured)
VALUES
  ('ieee-day-2026', 'IEEE Day Celebrations 2026', 'summit', 'branch', '2026-10-06', '10:00', 'BMSCE Main Auditorium', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&h=600&fit=crop&auto=format&q=70', 'A day of technical talks, member recognition and demos celebrating IEEE members around the world.', '#', true),
  ('pes-lab-2026', 'Power Systems Lab Workshop', 'workshop', 'pes', '2026-10-17', '14:00', 'EEE Power Lab', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&h=600&fit=crop&auto=format&q=70', 'Hands-on session on smart grids, renewable integration and power electronics.', '#', false),
  ('xtreme-2026', 'IEEEXtreme 20.0', 'hackathon', 'cs', '2026-10-24', '05:30', 'CSE Labs, PJA Block', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&h=600&fit=crop&auto=format&q=70', 'The global 24-hour IEEE programming competition, hosted on campus for BMSCE teams.', '#', true),
  ('phase-shift-2026', 'Phase Shift Hackathon 2026', 'hackathon', 'branch', '2026-11-14', '09:00', 'BMSCE Campus', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&h=600&fit=crop&auto=format&q=70', '36-hour inter-college hackathon across AI/ML, FinTech and Sustainability tracks.', '#', true),
  ('pcb-bootcamp-2026', 'PCB Design Bootcamp', 'workshop', 'pels-ies', '2026-11-28', '10:00', 'ECE Design Lab', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&h=600&fit=crop&auto=format&q=70', 'From schematic to fabricated board in one weekend.', '#', false),
  ('wie-summit-2026', 'WIE Tech Summit 2026', 'summit', 'wie', '2026-12-05', '09:30', 'BMSCE Main Auditorium', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=600&fit=crop&auto=format&q=70', 'Keynotes, panels and mentorship circles celebrating women in technology.', '#', false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Functions & Triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Auto-provision admins from whitelist on user signup
CREATE OR REPLACE FUNCTION public.handle_admin_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.admin_whitelist
  WHERE lower(email) = lower(new.email);

  IF v_role IS NOT NULL THEN
    INSERT INTO public.admins (id, full_name, role)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      v_role
    )
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  END IF;

  RETURN new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_admin_user_signup() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_admin_check ON auth.users;
CREATE TRIGGER on_auth_user_admin_check
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_user_signup();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity ENABLE ROW LEVEL SECURITY;

-- Chapters (Public read, admin write)
CREATE POLICY "chapters are public" ON public.chapters FOR SELECT TO public USING (true);
CREATE POLICY "admins manage chapters" ON public.chapters FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Membership Config (Public read, admin write)
CREATE POLICY "config is public" ON public.membership_config FOR SELECT TO public USING (true);
CREATE POLICY "admins manage config" ON public.membership_config FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Announcement (Public read, admin write)
CREATE POLICY "announcement is public" ON public.announcement FOR SELECT TO public USING (true);
CREATE POLICY "admins manage announcement" ON public.announcement FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Events (Public read, admin write)
CREATE POLICY "events are public" ON public.events FOR SELECT TO public USING (true);
CREATE POLICY "admins manage events" ON public.events FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Admins table: user checks own row; admins manage
CREATE POLICY "read own admin row" ON public.admins FOR SELECT TO authenticated USING (id = auth.uid() OR is_admin());
CREATE POLICY "admins manage admins" ON public.admins FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Admin Whitelist: only admins can view and manage
CREATE POLICY "admins read whitelist" ON public.admin_whitelist FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "admins manage whitelist" ON public.admin_whitelist FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Profiles
CREATE POLICY "members manage own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Orders: members create and read own; update if rejected; admins manage all
CREATE POLICY "members read own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "members create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "members resubmit rejected orders" ON public.orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'rejected')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "admins manage orders" ON public.orders FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Order items
CREATE POLICY "members read own items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "members add items to own orders" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "admins read items" ON public.order_items FOR SELECT TO authenticated USING (is_admin());

-- Admin Activity Log
CREATE POLICY "admins write activity" ON public.admin_activity FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admins read activity" ON public.admin_activity FOR SELECT TO authenticated USING (is_admin());

-- ---------------------------------------------------------------------------
-- 5. Storage (Payment Screenshots)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "members upload own proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "members update own proofs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'public-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "members read own proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'public-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "admins read all proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'public-assets' AND is_admin());
