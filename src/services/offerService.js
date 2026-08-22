import { supabase } from '../lib/supabaseClient';
import { adminLogService } from './adminLogService';

export const offerService = {
  /**
   * Fetch all offers/campaigns.
   */
  async getOffers() {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new campaign.
   */
  async createOffer(payload) {
    let res = null;
    const { data, error } = await supabase
      .from('offers')
      .insert(payload)
      .select();

    if (error) {
      console.warn('createOffer select error, falling back to direct insert:', error.message);
      const { error: directErr } = await supabase
        .from('offers')
        .insert(payload);
      if (directErr) throw directErr;
      res = payload;
    } else {
      res = data?.[0] || payload;
    }

    if (res) {
      await adminLogService.logAction(
        'created_campaign',
        'offers',
        res.id || null,
        { title: payload.title, discount_percent: payload.discount_percent }
      );
    }

    return res;
  },

  /**
   * Update an existing campaign.
   */
  async updateOffer(id, payload) {
    let res = null;
    const { data, error } = await supabase
      .from('offers')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      console.warn('updateOffer select error, falling back to direct update:', error.message);
      const { error: directErr } = await supabase
        .from('offers')
        .update(payload)
        .eq('id', id);
      if (directErr) throw directErr;
      res = { id, ...payload };
    } else {
      res = data?.[0] || { id, ...payload };
    }

    await adminLogService.logAction(
      'updated_campaign',
      'offers',
      id,
      { title: payload.title, discount_percent: payload.discount_percent }
    );

    return res;
  },

  /**
   * Toggle campaign active state.
   */
  async toggleOfferActive(id, is_active) {
    let res = null;
    const { data, error } = await supabase
      .from('offers')
      .update({ is_active })
      .eq('id', id)
      .select();

    if (error) {
      console.warn('toggleOfferActive select error, falling back to direct update:', error.message);
      const { error: directErr } = await supabase
        .from('offers')
        .update({ is_active })
        .eq('id', id);
      if (directErr) throw directErr;
      res = { id, is_active };
    } else {
      res = data?.[0] || { id, is_active };
    }

    await adminLogService.logAction(
      is_active ? 'activated_campaign' : 'deactivated_campaign',
      'offers',
      id,
      { is_active }
    );

    return res;
  },

  /**
   * Delete a campaign.
   */
  async deleteOffer(id) {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await adminLogService.logAction(
      'deleted_campaign',
      'offers',
      id,
      null
    );

    return true;
  }
};