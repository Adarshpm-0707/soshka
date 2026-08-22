import { supabase } from '../lib/supabaseClient';
import { adminLogService } from './adminLogService';

export const paymentSettingsService = {
  /**
   * Fetch payment settings list, including editor profiles.
   */
  async fetchPaymentSettings() {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*, profile:profiles(name, email)')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Upsert gateway settings.
   */
  async updatePaymentSettings(settings) {
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      gateway: settings.gateway,
      api_key: settings.api_key,
      api_secret: settings.api_secret,
      is_active: settings.is_active === true,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (settings.id) {
      const { data, error } = await supabase
        .from('payment_settings')
        .update(payload)
        .eq('id', settings.id)
        .select();

      if (error) {
        console.warn('updatePaymentSettings select error, falling back to direct update:', error.message);
        const { error: directErr } = await supabase
          .from('payment_settings')
          .update(payload)
          .eq('id', settings.id);
        if (directErr) throw directErr;
        result = { id: settings.id, ...payload };
      } else {
        result = data?.[0] || { id: settings.id, ...payload };
      }
    } else {
      const { data, error } = await supabase
        .from('payment_settings')
        .insert(payload)
        .select();

      if (error) {
        console.warn('createPaymentSettings select error, falling back to direct insert:', error.message);
        const { error: directErr } = await supabase
          .from('payment_settings')
          .insert(payload);
        if (directErr) throw directErr;
        result = payload;
      } else {
        result = data?.[0] || payload;
      }
    }

    // Log action
    if (result) {
      await adminLogService.logAction(
        'updated_payment_settings',
        'payment_settings',
        result.id,
        { gateway: settings.gateway, is_active: settings.is_active }
      );
    }

    return result;
  }
};
