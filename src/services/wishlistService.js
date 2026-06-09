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

    const { data, error } = await supabase
      .from('wishlist')
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();
    if (error) throw error;
    return data;
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
