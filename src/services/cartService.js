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
  async addToCart(userId, productId, quantity = 1, size = '') {
    // Check if the item already exists in the user's cart
    const { data: existing, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('size', size || '')
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      // Update quantity
      const newQty = existing.quantity + quantity;
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existing.id)
        .select();

      if (error) {
        console.warn('addToCart update select error, falling back to direct update:', error.message);
        const { error: directErr } = await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('id', existing.id);
        if (directErr) throw directErr;
        return { id: existing.id, quantity: newQty };
      }
      return data?.[0] || { id: existing.id, quantity: newQty };
    } else {
      // Insert new cart item
      const payload = { user_id: userId, product_id: productId, quantity, size: size || '' };
      const { data, error } = await supabase
        .from('cart_items')
        .insert(payload)
        .select();

      if (error) {
        console.warn('addToCart insert select error, falling back to direct insert:', error.message);
        const { error: directErr } = await supabase
          .from('cart_items')
          .insert(payload);
        if (directErr) throw directErr;
        return payload;
      }
      return data?.[0] || payload;
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
      .select();

    if (error) {
      console.warn('updateCartItemQuantity select error, falling back to direct update:', error.message);
      const { error: directErr } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);
      if (directErr) throw directErr;
      return { id: itemId, quantity };
    }
    return data?.[0] || { id: itemId, quantity };
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
