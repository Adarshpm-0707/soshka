-- ============================================================
-- database/cod_setup.sql
-- Run in: Supabase Dashboard → SQL Editor → New Query or via CLI
-- ============================================================

-- Add payment_method and cod_fee columns to public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'prepaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_fee NUMERIC NOT NULL DEFAULT 0;

-- Drop existing constraint if it exists and add check constraint on payment_method
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('prepaid', 'cod'));

-- Drop old status check constraint and add one that includes 'confirmed'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'confirmed', 'failed', 'processing', 'shipped', 'delivered', 'cancelled'));
