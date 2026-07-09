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
    -- 1. Add stock_decremented tracking column to public.orders
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_decremented boolean DEFAULT false;

    -- 2. Create the inventory adjustment trigger function
    CREATE OR REPLACE FUNCTION public.adjust_product_stock_on_order_status_change()
    RETURNS TRIGGER AS $$
    DECLARE
      item_rec jsonb;
      prod_id uuid;
      qty integer;
      current_stock integer;
      prod_name text;
    BEGIN
      -- Case 1: Decrement stock when order is confirmed/processing/packed/shipped/delivered and stock has not been decremented yet
      IF (NEW.order_status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered') OR NEW.status = 'paid') 
         AND NOT COALESCE(NEW.stock_decremented, false) THEN
        
        FOR item_rec IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
          prod_id := (item_rec->>'product_id')::uuid;
          qty := COALESCE((item_rec->>'quantity')::integer, (item_rec->>'qty')::integer, 1);
          
          -- Lock the product row for update to prevent race conditions/overselling
          SELECT name, stock INTO prod_name, current_stock FROM public.products WHERE id = prod_id FOR UPDATE;
          IF FOUND THEN
            -- Check if stock is sufficient
            IF current_stock < qty THEN
              RAISE EXCEPTION 'Insufficient stock for product % (Available: %, Requested: %)', prod_name, current_stock, qty;
            END IF;

            -- Decrement stock
            UPDATE public.products 
            SET stock = stock - qty
            WHERE id = prod_id;
          END IF;
        END LOOP;
        
        NEW.stock_decremented := true;
      END IF;

      -- Case 2: Restore stock when order is cancelled/failed and stock has already been decremented
      IF (NEW.order_status IN ('cancelled', 'failed') OR NEW.status = 'cancelled') 
         AND COALESCE(NEW.stock_decremented, false) THEN
        
        FOR item_rec IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
          prod_id := (item_rec->>'product_id')::uuid;
          qty := COALESCE((item_rec->>'quantity')::integer, (item_rec->>'qty')::integer, 1);
          
          -- Lock product row
          PERFORM 1 FROM public.products WHERE id = prod_id FOR UPDATE;
          IF FOUND THEN
            -- Increment stock
            UPDATE public.products 
            SET stock = stock + qty
            WHERE id = prod_id;
          END IF;
        END LOOP;
        
        NEW.stock_decremented := false;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 3. Bind the trigger to public.orders table
    DROP TRIGGER IF EXISTS trigger_adjust_product_stock ON public.orders;
    CREATE TRIGGER trigger_adjust_product_stock
      BEFORE INSERT OR UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.adjust_product_stock_on_order_status_change();

    -- 4. Backfill existing active/confirmed orders to mark their stock as decremented
    UPDATE public.orders 
    SET stock_decremented = true 
    WHERE (order_status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered') 
           OR status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered', 'paid'))
      AND (stock_decremented IS FALSE OR stock_decremented IS NULL);
  `;

  try {
    console.log('Running inventory stock triggers migration and legacy backfill...');
    await client.query(migrationSql);
    console.log('🎉 Stock trigger migrations and legacy backfill executed successfully!');
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
