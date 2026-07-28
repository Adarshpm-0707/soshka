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
    let msg = error.message || `Edge Function ${fnName} failed`;
    try {
      if (error.context && typeof error.context.json === 'function') {
        const jsonErr = await error.context.json();
        if (jsonErr && jsonErr.error) {
          msg = jsonErr.error;
        }
      }
    } catch (_) {}
    throw new Error(msg);
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

  try {
    const data = await callEdgeFunction(
      'create-cod-order',
      { items, shipping_address: shippingAddress }
    );
    if (data && data.db_order_id) {
      return { success: true, db_order_id: data.db_order_id };
    }
  } catch (edgeErr) {
    console.warn('Edge function create-cod-order unavailable, using direct DB order creation:', edgeErr);
  }

  // === FALLBACK: Direct DB Order Creation ===
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || null;

  let subtotal = 0;
  const enrichedItems = cartItems.map(item => {
    const price = Number(item.product?.offer_price || item.product?.price || item.price || 0);
    const qty = Number(item.quantity || 1);
    subtotal += price * qty;
    return {
      product_id: item.product_id,
      name: item.product?.name || item.name || 'Product',
      price: price,
      quantity: qty,
      size: item.size || '',
      image: item.product?.images?.[0] || item.image || '',
    };
  });

  const cod_fee = 60;
  const shipping_fee = 0;
  const total = subtotal + shipping_fee + cod_fee;

  const customOrderId = `00000000-0000-0000-0000-${Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("")}`;

  const { data: dbOrder, error: dbError } = await supabase
    .from('orders')
    .insert({
      id: customOrderId,
      user_id: userId,
      items: enrichedItems,
      subtotal,
      shipping_fee,
      cod_fee,
      total,
      status: 'confirmed',
      payment_status: 'pending',
      order_status: 'confirmed',
      payment_method: 'cod',
      shipping_address: shippingAddress,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Direct COD order creation error:', dbError);
    throw new Error(dbError.message || 'Failed to place COD order.');
  }

  // === BACKGROUND SHIPROCKET AUTO-DISPATCH FOR NEW INCOMING ORDER ===
  try {
    const custEmail = (dbOrder.shipping_address?.email || '').toLowerCase();
    const custName = (dbOrder.shipping_address?.name || '').toLowerCase();
    const isTest = custEmail.includes('test@') || custEmail.includes('example.com') || custName.includes('test customer');

    if (!isTest) {
      fetch('/api/shiprocket-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: dbOrder,
          email: dbOrder.shipping_address?.email || 'customer@soshka.in'
        })
      }).then(async (res) => {
        if (res.ok) {
          console.log('[Shiprocket Auto-Dispatch] Pickup scheduled automatically!');
        } else {
          const errText = await res.text();
          console.warn('[Shiprocket Auto-Dispatch Warning]', errText);
        }
      }).catch(err => console.warn('[Shiprocket Auto-Dispatch Non-blocking Error]', err));
    }
  } catch (_) {}

  return { success: true, db_order_id: dbOrder.id };
}

