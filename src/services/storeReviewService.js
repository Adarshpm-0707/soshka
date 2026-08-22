import { supabase } from '../lib/supabaseClient';
import { adminLogService } from './adminLogService';

export const storeReviewService = {
  /**
   * Fetch all store-wide reviews / testimonials.
   */
  async fetchStoreReviews() {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new store-wide review.
   */
  async createStoreReview({ name, location, rating, comment, image_url, platform }) {
    const payload = {
      name,
      location,
      rating: Number(rating),
      comment,
      image_url: image_url || null,
      platform: platform || 'other'
    };

    let res = null;
    const { data, error } = await supabase
      .from('store_reviews')
      .insert(payload)
      .select();

    if (error) {
      console.warn('createStoreReview select error, falling back to direct insert:', error.message);
      const { error: directErr } = await supabase
        .from('store_reviews')
        .insert(payload);
      if (directErr) throw directErr;
      res = payload;
    } else {
      res = data?.[0] || payload;
    }

    // Log this action in admin activity log
    if (res) {
      try {
        await adminLogService.logAction(
          'created_store_review',
          'store_reviews',
          res.id || null,
          { name, has_image: !!image_url }
        );
      } catch (logErr) {
        console.error('Failed to log admin action:', logErr);
      }
    }

    return res;
  },

  /**
   * Delete a store-wide review by ID.
   */
  async deleteStoreReview(id) {
    const { error } = await supabase
      .from('store_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log this action in admin activity log
    try {
      await adminLogService.logAction(
        'deleted_store_review',
        'store_reviews',
        id,
        null
      );
    } catch (logErr) {
      console.error('Failed to log admin action:', logErr);
    }

    return true;
  },

  /**
   * Update a store-wide review by ID.
   */
  async updateStoreReview(id, { name, location, rating, comment, image_url, platform }) {
    const payload = {
      name,
      location,
      rating: Number(rating),
      comment,
      image_url: image_url || null,
      platform: platform || 'other'
    };

    let res = null;
    const { data, error } = await supabase
      .from('store_reviews')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      console.warn('updateStoreReview select error, falling back to direct update:', error.message);
      const { error: directErr } = await supabase
        .from('store_reviews')
        .update(payload)
        .eq('id', id);
      if (directErr) throw directErr;
      res = { id, ...payload };
    } else {
      res = data?.[0] || { id, ...payload };
    }

    // Log this action in admin activity log
    try {
      await adminLogService.logAction(
        'updated_store_review',
        'store_reviews',
        id,
        { name, has_image: !!image_url }
      );
    } catch (logErr) {
      console.error('Failed to log admin action:', logErr);
    }

    return data;
  }
};
