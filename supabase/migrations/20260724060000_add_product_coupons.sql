-- Add product filtering to coupons and products
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applicable_product_ids UUID[] DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS applicable_coupon_ids UUID[] DEFAULT NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
