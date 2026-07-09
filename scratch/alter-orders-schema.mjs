import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  const queries = [
    // Add missing columns to orders table
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT 0`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature text`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_order_id text`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket_awb text`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()`,
    // Drop old status constraint and add new one that includes 'paid' and 'failed'
    `ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check`,
    `ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
      CHECK (status IN ('pending','paid','failed','shipped','delivered','cancelled','processing'))`,
    // Add admin update policy for orders (for payment verification)
    `DROP POLICY IF EXISTS "Admins can update orders" ON public.orders`,
    `CREATE POLICY "Admins can update orders"
      ON public.orders FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin())`,
    // Allow service role to update orders (for edge functions with service_role key)
    `DROP POLICY IF EXISTS "Service role can update orders" ON public.orders`,
    // Note: service_role bypasses RLS entirely — no policy needed
    // Make sure updated_at auto-updates
    `CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`,
    `DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders`,
    `CREATE TRIGGER set_orders_updated_at
      BEFORE UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()`,
  ];

  for (const q of queries) {
    try {
      await client.query(q);
      const label = q.split('\n')[0].substring(0, 80);
      console.log(`  ✅ ${label}`);
    } catch (err) {
      console.error(`  ❌ FAILED: ${q.substring(0, 80)}\n     Reason: ${err.message}`);
    }
  }

  // Verify new columns exist
  const { rows } = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders'
    ORDER BY ordinal_position
  `);
  console.log('\n📋 Orders table columns after migration:');
  rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type}) nullable=${r.is_nullable}`));

  await client.end();
  console.log('\n✅ Migration complete.');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
