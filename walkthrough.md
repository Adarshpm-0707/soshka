# Refund & Cancellation Walkthrough

This document summarizes the changes applied to successfully implement Soshka's secure server-side Refund & Cancellation workflow.

---

## 🚀 Changes Made

### 1. Database Schema & Migration
* **Executed script** `scratch/apply_migration.mjs` and `scratch/apply_stock_migration.mjs` directly against the remote Supabase database.
* **Database Updates**:
  * Added decoupled status fields: `payment_status` (pending, paid, refunded, failed) and `order_status` (pending, confirmed, processing, packed, shipped, delivered, cancelled) to the `orders` table.
  * Added refund columns (`refund_id`, `refund_amount`, `refund_status`, `refund_processed_at`, `cancelled_at`, `cancellation_reason`, `paid_at`).
  * Created `refunds` table as a secure audit log for tracking Razorpay API refund attempts and callback payload details.
  * Configured Row Level Security (RLS) on the `refunds` table to allow authenticated owners and administrators to read refund logs.
  * Successfully backfilled all existing order records to set their `payment_status`, `order_status`, and `paid_at` based on their previous status logs.
  * **Automatic Inventory Stock Adjustments (Trigger)**: Added the `stock_decremented` flag column and a `BEFORE INSERT OR UPDATE` trigger on `public.orders` that automatically decrements the corresponding product stocks upon order confirmation (to prevent overselling), and automatically restores (increments) the stock quantities if the order is cancelled or marked as failed.

### 2. Supabase Edge Functions
* **`create-razorpay-order`**: Set `payment_status = 'pending'`, `order_status = 'pending'`, and store `order_id` (Razorpay Order ID) upon initialization.
* **`create-cod-order`**: Set `payment_status = 'pending'` and `order_status = 'confirmed'` on checkout.
* **`verify-razorpay-payment`**: Signature verification sets `payment_status = 'paid'`, `order_status = 'confirmed'`, and records `paid_at = now()`, `payment_id = razorpay_payment_id`, and `order_id = razorpay_order_id`. Idempotency guards updated to check `payment_status`.
* **`cancel-order`**:
  * Authenticates request and verifies user ownership (or Admin role).
  * Validates prepaid-only order cancellation.
  * Verifies cancellation is within the 1-hour window of `paid_at`.
  * Rechecks that the order is not already shipped, packed, or delivered.
  * Invokes the Razorpay Refund API (`POST /v1/payments/{payment_id}/refund`).
  * Invokes the Shiprocket Order Cancel API if a shipment exists.
  * Records the refund audit log in `refunds` table and updates `orders` with cancelled status flags.
  * Sends a branded cancellation confirmation email containing the refund status, refund ID, and display order ID.
* **`razorpay-webhook`** (New):
  * Listens for Razorpay's `refund.processed` and `refund.failed` webhook callbacks.
  * Securely validates the webhook payload signature using `RAZORPAY_WEBHOOK_SECRET`.
  * Transitions `orders.refund_status` and `refunds.status` to `completed` or `failed` according to final transaction results.

### 3. Frontend UI Upgrades
* **`OrderDetail.jsx`**:
  * Custom cancel button displays dynamically based on prepaid payment status, cancellation time limits, and non-shipped status.
  * Replaced native browser confirmation boxes with a visually matching, custom confirmation modal.
  * Integrated a gorgeous step-by-step interactive **Refund & Cancellation Timeline** progress stepper for cancelled online orders.
  * Rendered custom alert banners for cancelled cash-on-delivery (COD) orders.
* **`OrdersPage.jsx`**: Show corresponding refund status badges (Refund Processing, Refund Completed, Refund Failed) next to the "Cancelled" status badge in the customer's history.
* **`AdminOrdersPage.jsx` & `SuperAdminOrdersPage.jsx`**:
  * Integrated a dedicated "Refund Details" block in the order modal.
  * Expanded status filters under "Cancelled Orders" to allow searching and filtering transactions by refund status.
  * **Restricted Order Deletion capability**: Removed the "Delete Order Record" button and matching states/functions from `AdminOrdersPage.jsx`, leaving order deletion capabilities exclusively on the superadmin side (`SuperAdminOrdersPage.jsx`).

---

## 🧪 Validation & Verification

1. **Database Verification**: Diagnostics checked out and verified that the columns exist and RLS policies are applied successfully.
2. **Build Success**: React application successfully compiled locally with zero errors in 6.97s.
3. **Edge Function Deployments**: Deployed successfully to the remote project `bmbegjxfkpyenndfbcdj`.
