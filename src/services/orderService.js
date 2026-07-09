import { supabase } from '../lib/supabaseClient';

export const orderService = {
  /**
   * Create a new order (COD flow only — Razorpay orders are created by Edge Function).
   * The Edge Function inserts the order for Razorpay; this method is for COD.
   */
  async createOrder({ userId, items, subtotal, shippingFee, total, shippingAddress, paymentId }) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        items,
        subtotal: subtotal ?? total,
        shipping_fee: shippingFee ?? 0,
        total,
        shipping_address: shippingAddress,
        payment_id: paymentId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch all orders for a specific user.
   */
  async getOrders(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Fetch a single order by ID.
   */
  async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark an order as failed (called when Razorpay payment.failed fires).
   * Idempotent: will not overwrite a 'paid' order.
   */
  async markOrderFailed(orderId) {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .neq('status', 'paid'); // never overwrite paid

    if (error) console.error('Failed to mark order as failed:', error);
  },

  /**
   * Cancel and delete an order within the 1-hour window (triggers Shiprocket cancellation).
   */
  async cancelOrder(orderId) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ order_id: orderId })
    });

    const responseData = await res.json();
    if (!res.ok) {
      throw new Error(responseData.error || 'Failed to cancel order');
    }
    return responseData;
  }
};
