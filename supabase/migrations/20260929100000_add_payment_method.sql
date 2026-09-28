-- Add payment_method column to orders table to support Cash payments at desk
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'UPI';
