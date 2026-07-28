-- 1. Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,           -- e.g. "SAVE20"
  type TEXT NOT NULL,                  -- 'percentage' | 'flat'
  value NUMERIC NOT NULL,              -- 20 = 20% OR ₹200 flat
  min_order_amount NUMERIC DEFAULT 0,  -- min cart total to apply
  max_uses INT DEFAULT NULL,           -- NULL = unlimited
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL = no expiry
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Track per-user coupon usage (prevent reuse)
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_id, user_id)           -- one use per user per coupon
);

-- 3. ALTER orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running script
DROP POLICY IF EXISTS "read active coupons" ON coupons;
DROP POLICY IF EXISTS "admin manage coupons" ON coupons;
DROP POLICY IF EXISTS "own usage" ON coupon_usage;

-- coupons: all authenticated read, only admin/superadmin write
CREATE POLICY "read active coupons" ON coupons
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "admin manage coupons" ON coupons
  FOR ALL TO authenticated USING (is_superadmin() OR is_admin());

-- coupon_usage: user sees own usage only
CREATE POLICY "own usage" ON coupon_usage
  FOR ALL TO authenticated USING ((select auth.uid()) = user_id);

-- 6. Grant API access to roles & reload PostgREST schema cache
GRANT ALL ON TABLE public.coupons TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.coupon_usage TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';


