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
    const { data, error } = await supabase
      .from('offers')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await adminLogService.logAction(
      'created_campaign',
      'offers',
      data.id,
      { title: payload.title, discount_percent: payload.discount_percent }
    );

    return data;
  },

  /**
   * Update an existing campaign.
   */
  async updateOffer(id, payload) {
    const { data, error } = await supabase
      .from('offers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await adminLogService.logAction(
      'updated_campaign',
      'offers',
      id,
      { title: payload.title, discount_percent: payload.discount_percent }
    );

    return data;
  },

  /**
   * Toggle campaign active state.
   */
  async toggleOfferActive(id, is_active) {
    const { data, error } = await supabase
      .from('offers')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await adminLogService.logAction(
      is_active ? 'activated_campaign' : 'deactivated_campaign',
      'offers',
      id,
      { is_active }
    );

    return data;
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