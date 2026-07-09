/**
 * checkoutService.js
 * Handles the complete Razorpay payment flow via Supabase Edge Functions.
 * All price calculations happen server-side — client never sends amounts.
 */

import { supabase } from '../lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Load Razorpay checkout script dynamically.
 * Returns true if loaded, false on network failure.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Call a Supabase Edge Function using the official Supabase SDK client.
 */
async function callEdgeFunction(fnName, body) {
  const { data, error } = await supabase.functions.invoke(fnName, {
    body,
  });

  if (error) {
    console.error(`Edge Function ${fnName} error:`, error);
    throw new Error(error.message || `Edge Function ${fnName} failed`);
  }
  return data;
}

/**
 * Main Razorpay payment flow.
 *
 * @param {Array}  cartItems        - Array of cart items from useCart()
 * @param {Object} shippingAddress  - Shipping address object
 * @param {Object} userDetails      - { name, email, phone }
 * @returns {Promise<{success: boolean, db_order_id: string}>}
 */
export async function initiateRazorpayPayment(cartItems, shippingAddress, userDetails) {
  // 1. Load Razorpay SDK
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Razorpay SDK failed to load. Check your internet connection.');
  }

  // 2. Prepare items for server (only product_id, qty, size — no prices)
  const items = cartItems.map(item => ({
    product_id: item.product_id,
    qty: item.quantity,
    size: item.size || '',
  }));

  // 3. Call Edge Function to create Razorpay order (server calculates price)
  const { order_id, amount, key_id, db_order_id } = await callEdgeFunction(
    'create-razorpay-order',
    { items, shipping_address: shippingAddress }
  );

  // 4. Open Razorpay modal — return a Promise that resolves on success
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: key_id,
      order_id,
      amount,
      currency: 'INR',
      name: 'Soshka',
      description: 'Secure Order Payment',
      theme: { color: '#8b5cf6' },
      prefill: {
        name: userDetails?.name || shippingAddress?.name || '',
        email: userDetails?.email || shippingAddress?.email || '',
        contact: userDetails?.phone || shippingAddress?.phone || '',
      },

      handler: async (response) => {
        try {
          // 5. Verify payment signature server-side
          const result = await callEdgeFunction('verify-razorpay-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            db_order_id,
          });

          if (result.success) {
            resolve({ success: true, db_order_id });
          } else {
            reject(new Error(result.error || 'Payment verification failed'));
          }
        } catch (err) {
          reject(err);
        }
      },

      modal: {
        ondismiss: () => {
          // Order remains in 'pending' — user can retry with same order
          reject({ cancelled: true, db_order_id });
        },
      },
    });

    rzp.on('payment.failed', async (response) => {
      console.error('Payment failed:', response.error);
      // Mark order as failed in DB
      try {
        await supabase
          .from('orders')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', db_order_id)
          .neq('status', 'paid'); // never overwrite a paid order
      } catch (dbErr) {
        console.error('Failed to mark order as failed:', dbErr);
      }
      reject({
        paymentFailed: true,
        db_order_id,
        error: response.error?.description || 'Payment was declined',
      });
    });

    rzp.open();
  });
}

/**
 * Initiate COD payment flow.
 *
 * @param {Array}  cartItems        - Array of cart items from useCart()
 * @param {Object} shippingAddress  - Shipping address object
 * @returns {Promise<{success: boolean, db_order_id: string}>}
 */
export async function initiateCODPayment(cartItems, shippingAddress) {
  const items = cartItems.map(item => ({
    product_id: item.product_id,
    qty: item.quantity,
    size: item.size || '',
  }));

  const { db_order_id } = await callEdgeFunction(
    'create-cod-order',
    { items, shipping_address: shippingAddress }
  );

  return { success: true, db_order_id };
}

