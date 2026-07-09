-- ============================================================
-- orders-rls-update.sql
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Drop old status check constraint (too restrictive)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new status constraint including 'paid' and 'failed'
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','failed','processing','shipped','delivered','cancelled'));

-- Add missing columns (idempotent)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admin update policy (for admin panel order management)
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NOTE: The Edge Functions (verify-razorpay-payment, create-shiprocket-order)
-- use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS entirely. No additional 
-- policy is needed for service-role writes.
