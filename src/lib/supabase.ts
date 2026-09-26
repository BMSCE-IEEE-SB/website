import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder') &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-supabase'),
  );

/**
 * Demo mode: no Supabase project is connected, so the whole flow runs on
 * localStorage with sample data. Demo shortcuts are never available once
 * Supabase is configured.
 */
export const isDemoMode = () => !isSupabaseConfigured();

export const supabase = createClient(supabaseUrl, supabaseKey);

export const STORAGE_BUCKET = 'public-assets';
