import { supabase } from '../lib/supabaseClient';

export const orderService = {
  /**
   * Create a new order after payment validation.
   */
  async createOrder({ userId, items, total, shippingAddress, paymentId }) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        items,
        total,
        shipping_address: shippingAddress,
        payment_id: paymentId,
        status: 'pending' // default status
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
   * Fetch a single order detail.
   */
  async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }
};
