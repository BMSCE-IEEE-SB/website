-- Allow administrators to update member profiles (e.g. assigning IEEE member IDs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'admins update profiles' AND polrelid = 'public.profiles'::regclass
  ) THEN
    CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;
