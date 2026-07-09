# Refund & Cancellation Implementation Plan

This document outlines the technical design, database updates, backend Edge Function changes, webhook setup, and frontend enhancements required to implement the Refund & Cancellation system for Soshka.

---

## User Review Required

> [!IMPORTANT]
> The database changes introduce decoupled fields (`payment_status` and `order_status`) to replace/supplement the single `status` column. We will keep both `status` and `order_status` in sync using database updates/triggers to avoid breaking any legacy references in the app.

> [!NOTE]
> We will create a custom, visually rich React modal in `OrderDetail.jsx` rather than relying on browser native `window.confirm` to ensure a premium user experience in line with Soshka's brand aesthetics.

---

## Open Questions

*No critical open questions. We have mapped out the requirements completely and verified existing code.*

---

## Proposed Changes

We will group the changes into: Database migrations, Backend Edge Functions, and Frontend UI components.

### 1. Database Schema

We will create a new migration script to update the `orders` table and create a dedicated `refunds` audit table.

#### [NEW] [apply_migration.mjs](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/scratch/apply_migration.mjs)
A script to apply the SQL changes directly to the remote database using the existing connection string.

#### SQL Migration Script
```sql
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
```

---

### 2. Backend Edge Functions

We will enhance the existing order Edge Functions to populate the new fields and create the webhook handler.

#### [MODIFY] [cancel-order index.ts](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/supabase/functions/cancel-order/index.ts)
* Authenticate user and verify order ownership.
* Verify order is prepaid (`payment_method !== 'cod'`).
* Recheck that order is not already shipped/delivered/packed (status must be in `'pending'`, `'confirmed'`, `'processing'`).
* Verify cancellation is within 1 hour of payment (`paid_at` + 1 hour > now).
* Call Razorpay Payment Refund API:
  `POST https://api.razorpay.com/v1/payments/{payment_id}/refund`
  Body: `{ amount: total_paise, speed: "normal", notes: { reason: "Customer cancelled within one hour" } }`
* Call Shiprocket Cancel API if `shiprocket_order_id` is set.
* Write records to `refunds` table and update the `orders` table (`payment_status = 'refunded'`, `order_status = 'cancelled'`, `status = 'cancelled'`, `refund_status = 'processing'`, `refund_id`, `cancelled_at = now()`).
* Send "Your Order Has Been Cancelled" email with the exact layout specified.

#### [NEW] [razorpay-webhook index.ts](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/supabase/functions/razorpay-webhook/index.ts)
* Listen to Razorpay webhooks (`refund.processed` and `refund.failed`).
* Validate signature using Deno native web crypto and `RAZORPAY_WEBHOOK_SECRET`.
* On `refund.processed`:
  * Update `refunds` status to `completed` and set `completed_at`.
  * Update `orders` refund columns (`refund_status = 'completed'`, `payment_status = 'refunded'`, `refund_processed_at = now()`).
* On `refund.failed`:
  * Update `refunds` status to `failed`.
  * Update `orders` `refund_status = 'failed'`.

#### [MODIFY] [verify-razorpay-payment index.ts](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/supabase/functions/verify-razorpay-payment/index.ts)
* After successful signature verification, update the order:
  * Set `payment_status = 'paid'`
  * Set `order_status = 'confirmed'`
  * Set `status = 'paid'` (fallback compatibility)
  * Set `paid_at = new Date().toISOString()`
  * Set `payment_id = razorpay_payment_id`
  * Set `order_id = razorpay_order_id`

#### [MODIFY] [create-razorpay-order index.ts](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/supabase/functions/create-razorpay-order/index.ts)
* Set `payment_status = 'pending'`, `order_status = 'pending'`, and `order_id = rpOrder.id` on order creation.

#### [MODIFY] [create-cod-order index.ts](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/supabase/functions/create-cod-order/index.ts)
* Set `payment_status = 'pending'`, `order_status = 'confirmed'` on COD order creation.

---

### 3. Frontend UI Modifications

#### [MODIFY] [OrderDetail.jsx](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/src/pages/Orders/OrderDetail.jsx)
* Update Cancel Order button visibility:
  * Only show if `payment_status === 'paid'` AND `order_status` (or `status`) is in `['pending', 'confirmed', 'processing']` AND `paid_at` + 1 hour > now().
* Replace `window.confirm` with a premium custom confirmation dialog modal.
* If the order is cancelled, show a gorgeous vertical/horizontal interactive stepper representing the refund status timeline:
  * **Order Placed**
  * **Payment Successful**
  * **Cancellation Requested**
  * **Refund Initiated** (if `refund_status` is `'processing'` or `'completed'`)
  * **Refund Completed** (if `refund_status` is `'completed'`)

#### [MODIFY] [OrdersPage.jsx](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/src/pages/Orders/OrdersPage.jsx)
* For cancelled orders, render an additional badge indicating refund status:
  * If `refund_status === 'processing'`: "Refund Processing" (amber/blue badge).
  * If `refund_status === 'completed'`: "Refund Completed" (emerald badge).
  * If `refund_status === 'failed'`: "Refund Failed" (rose badge).

#### [MODIFY] [AdminOrdersPage.jsx](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/src/pages/Admin/AdminOrdersPage.jsx) and [SuperAdminOrdersPage.jsx](file:///c:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/src/pages/SuperAdmin/SuperAdminOrdersPage.jsx)
* Add a dedicated "Refund Details" section inside the order detail modal:
  * Shows: Refund Status, Refund ID, Cancelled At, Reason, and Refund Amount.
* Expand the status filter dropdown in the "Cancelled Orders" tab to include:
  * Refund Pending
  * Refund Completed
  * Refund Failed

---

## Verification Plan

### Automated Tests
1. **Edge Function testing**: Run local/remote test invocations to verify constraints:
   - Request cancellation of COD order -> must fail.
   - Request cancellation of order > 1 hour -> must fail.
   - Request cancellation of shipped order -> must fail.
   - Request cancellation of valid prepaid order -> must succeed, call Razorpay + Shiprocket APIs, update database, and trigger email.
2. **Webhook Signature Verification**: Invoke the webhook endpoint with mock payloads and valid/invalid signatures to test protection.

### Manual Verification
1. Place a test Razorpay order on staging.
2. Go to the Order Details page within 1 hour, click the custom "Cancel Order" button, approve the premium modal.
3. Verify that:
   - Razorpay refund is initiated.
   - Shiprocket order is cancelled.
   - Status updates in DB.
   - Branded cancellation email is sent.
   - Customer UI displays "Cancelled" with the refund status badge and the correct timeline stepper.
   - Admin UI displays the refund details and allows searching cancelled orders by refund status.
