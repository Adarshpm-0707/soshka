import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  const migrationSql = `
    -- 1. Alter public.orders table to add refund/cancellation fields
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status text DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'));
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_id text; -- Razorpay Order ID
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_id text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_amount numeric;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'none' CHECK (refund_status IN ('none', 'processing', 'completed', 'failed'));
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_processed_at timestamp with time zone;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

    -- 2. Create refunds table for tracking refund attempts/responses
    CREATE TABLE IF NOT EXISTS public.refunds (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
      payment_id text,
      razorpay_refund_id text,
      amount numeric,
      status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      reason text,
      created_at timestamp with time zone DEFAULT now(),
      completed_at timestamp with time zone,
      raw_response jsonb
    );

    -- 3. Enable RLS on public.refunds
    ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

    -- 4. Create RLS policies for refunds
    DROP POLICY IF EXISTS "Users can view own refunds" ON public.refunds;
    CREATE POLICY "Users can view own refunds"
      ON public.refunds FOR SELECT
      TO authenticated
      USING (
        public.is_admin() OR
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = refunds.order_id
            AND o.user_id = auth.uid()
        )
      );

    -- 5. Backfill existing orders
    UPDATE public.orders SET payment_status = 'paid', order_status = 'confirmed', paid_at = created_at WHERE status = 'paid';
    UPDATE public.orders SET payment_status = 'paid', order_status = 'processing', paid_at = created_at WHERE status = 'processing';
    UPDATE public.orders SET payment_status = 'paid', order_status = 'shipped', paid_at = created_at WHERE status = 'shipped';
    UPDATE public.orders SET payment_status = 'paid', order_status = 'delivered', paid_at = created_at WHERE status = 'delivered';
    UPDATE public.orders SET payment_status = 'paid', order_status = 'cancelled', paid_at = created_at WHERE status = 'cancelled' AND payment_method != 'cod';
    UPDATE public.orders SET payment_status = 'pending', order_status = 'cancelled' WHERE status = 'cancelled' AND (payment_method = 'cod' OR payment_method IS NULL);
    UPDATE public.orders SET payment_status = 'failed', order_status = 'pending' WHERE status = 'failed';
    UPDATE public.orders SET payment_status = 'pending', order_status = 'pending' WHERE status = 'pending';
  `;

  try {
    console.log('Running database migrations...');
    await client.query(migrationSql);
    console.log('🎉 Migrations and backfill executed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
