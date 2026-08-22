import { supabase } from '../lib/supabaseClient';

export const wishlistService = {
  /**
   * Fetch all wishlist items for a user, including product details.
   */
  async getWishlist(userId) {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, product:products(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  /**
   * Add a product to the user's wishlist.
   */
  async addToWishlist(userId, productId) {
    // Check if it's already there
    const { data: existing, error: checkError } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) return existing; // Already exists, return it

    const payload = { user_id: userId, product_id: productId };
    const { data, error } = await supabase
      .from('wishlist')
      .insert(payload)
      .select();

    if (error) {
      console.warn('addToWishlist select error, falling back to direct insert:', error.message);
      const { error: directErr } = await supabase
        .from('wishlist')
        .insert(payload);
      if (directErr) throw directErr;
      return payload;
    }
    return data?.[0] || payload;
  },

  /**
   * Remove a product from the user's wishlist.
   */
  async removeFromWishlist(userId, productId) {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) throw error;
  },

  /**
   * Check if a product is in the user's wishlist.
   */
  async checkIsInWishlist(userId, productId) {
    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }
};
