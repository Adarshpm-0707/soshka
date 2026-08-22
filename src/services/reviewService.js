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
    const payload = { user_id: userId, product_id: productId, rating, comment };
    let reviewData = null;

    // 1. Insert review
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .insert(payload)
      .select();

    if (reviewError) {
      console.warn('createReview select error, falling back to direct insert:', reviewError.message);
      const { error: directErr } = await supabase
        .from('reviews')
        .insert(payload);
      if (directErr) throw directErr;
      reviewData = payload;
    } else {
      reviewData = reviews?.[0] || payload;
    }

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
   * Delete a review and recalculate average rating & review count for the product.
   */
  async deleteReview(reviewId, productId) {
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) throw deleteError;

    // Fetch all remaining reviews for this product to recalculate
    const { data: allReviews, error: fetchError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (!fetchError) {
      const reviewCount = allReviews ? allReviews.length : 0;
      const averageRating = reviewCount > 0 
        ? parseFloat((allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

      await supabase
        .from('products')
        .update({
          rating: averageRating,
          review_count: reviewCount
        })
        .eq('id', productId);
    }
  },

  /**
   * Fetch latest reviews across all products.
   */
  async getAllReviews(limit = 10) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profile:profiles(name, avatar_url), product:products(name, images)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Fetch all product reviews across the store.
   */
  async fetchAllProductReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profile:profiles(name, avatar_url), product:products(name, images)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update a review and recalculate average rating & review count for the product.
   */
  async updateReview(reviewId, productId, { rating, comment }) {
    const payload = { rating: Number(rating), comment };
    let reviewData = null;

    const { data: reviews, error: updateError } = await supabase
      .from('reviews')
      .update(payload)
      .eq('id', reviewId)
      .select();

    if (updateError) {
      console.warn('updateReview select error, falling back to direct update:', updateError.message);
      const { error: directErr } = await supabase
        .from('reviews')
        .update(payload)
        .eq('id', reviewId);
      if (directErr) throw directErr;
      reviewData = { id: reviewId, ...payload };
    } else {
      reviewData = reviews?.[0] || { id: reviewId, ...payload };
    }

    // Fetch all reviews for this product to recalculate
    const { data: allReviews, error: fetchError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (!fetchError && allReviews) {
      const reviewCount = allReviews.length;
      const averageRating = parseFloat(
        (allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      );

      // Update the product row
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
    const { error } = await supabase
      .from('contact_requests')
      .insert({ name, email, message });

    if (error) throw error;
    return { name, email, message };
  }
};
