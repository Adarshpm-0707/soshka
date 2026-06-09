import { supabase } from '../lib/supabaseClient';

export const reviewService = {
  /**
   * Fetch reviews for a product with offset pagination.
   */
  async getProductReviews(productId, page = 1, limit = 5) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('reviews')
      .select('*, profile:profiles(name, avatar_url)', { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { reviews: data, totalCount: count || 0 };
  },

  /**
   * Add a review for a product, and recalculate average rating & review count for the product.
   */
  async createReview({ userId, productId, rating, comment }) {
    // 1. Insert review
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .insert({ user_id: userId, product_id: productId, rating, comment })
      .select()
      .single();

    if (reviewError) throw reviewError;

    // 2. Fetch all reviews for this product to recalculate
    const { data: allReviews, error: fetchError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (!fetchError && allReviews) {
      const reviewCount = allReviews.length;
      const averageRating = parseFloat(
        (allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      );

      // 3. Update the product row
      await supabase
        .from('products')
        .update({
          rating: averageRating,
          review_count: reviewCount
        })
        .eq('id', productId);
    }

    return reviewData;
  },

  /**
   * Submit a contact request form.
   */
  async submitContactRequest({ name, email, message }) {
    const { data, error } = await supabase
      .from('contact_requests')
      .insert({ name, email, message })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
