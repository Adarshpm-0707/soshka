-- Migration to allow anonymous and customer (non-admin) users to read active coupons and record usage per customer

-- 1. Add email column to coupon_usage if not present
ALTER TABLE public.coupon_usage ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Fix SELECT policy on coupons to allow anon and authenticated users to read active coupons
DROP POLICY IF EXISTS "read active coupons" ON coupons;
CREATE POLICY "read active coupons" ON coupons
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- 3. Allow INSERT into coupon_usage for logged in & anonymous users
DROP POLICY IF EXISTS "insert coupon usage" ON coupon_usage;
CREATE POLICY "insert coupon usage" ON coupon_usage
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- 4. Grant table permissions
GRANT SELECT ON TABLE public.coupons TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.coupon_usage TO anon, authenticated, service_role;

-- 5. Create RPC function with SECURITY DEFINER to safely increment coupon usage without exposing UPDATE on coupons table to public
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(
  p_coupon_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
BEGIN
  -- Increment used_count
  UPDATE coupons
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE id = p_coupon_id
  RETURNING * INTO v_coupon;

  -- Record usage in coupon_usage if user_id or email is present
  IF p_user_id IS NOT NULL OR (p_email IS NOT NULL AND p_email <> '') THEN
    BEGIN
      INSERT INTO coupon_usage (coupon_id, user_id, order_id, email)
      VALUES (p_coupon_id, p_user_id, p_order_id, p_email);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore duplicate or constraint error in coupon_usage
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object('success', true, 'used_count', v_coupon.used_count);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(UUID, UUID, UUID, TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
