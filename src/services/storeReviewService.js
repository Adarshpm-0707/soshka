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
    const { data, error } = await supabase
      .from('store_reviews')
      .insert({
        name,
        location,
        rating: Number(rating),
        comment,
        image_url: image_url || null,
        platform: platform || 'other'
      })
      .select()
      .single();

    if (error) throw error;

    // Log this action in admin activity log
    if (data) {
      try {
        await adminLogService.logAction(
          'created_store_review',
          'store_reviews',
          data.id,
          { name, has_image: !!image_url }
        );
      } catch (logErr) {
        console.error('Failed to log admin action:', logErr);
      }
    }

    return data;
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
  }
};
