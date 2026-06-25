import { supabase } from '../lib/supabaseClient';

export const cartService = {
  /**
   * Fetch all cart items for a user, including product details.
   */
  async getCart(userId) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*, offers(*))')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  /**
   * Add a product to the cart. If the product is already in the cart, increment quantity.
   */
  async addToCart(userId, productId, quantity = 1) {
    // Check if the item already exists in the user's cart
    const { data: existing, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // Insert new cart item
      const { data, error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, product_id: productId, quantity })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  /**
   * Update the quantity of a cart item.
   */
  async updateCartItemQuantity(itemId, quantity) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Remove a single item from the cart.
   */
  async removeFromCart(itemId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },

  /**
   * Clear all items from a user's cart.
   */
  async clearCart(userId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }
};
