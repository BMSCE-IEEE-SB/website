-- Add missing credentials_sent_at and admin_note columns to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS credentials_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_note text;

-- Add index on credentials_sent_at to accelerate admin member filtering (waiting vs sent)
CREATE INDEX IF NOT EXISTS orders_credentials_sent_at_idx ON public.orders (credentials_sent_at);
