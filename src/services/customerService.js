import { supabase } from '../lib/supabaseClient';
import { adminLogService } from './adminLogService';

export const customerService = {
  /**
   * Fetch all registered customer profiles (users with role = 'user').
   */
  async fetchAllCustomers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    // Show all profiles except admin/superadmin accounts
    return (data || []).filter(
      (c) =>
        c.role !== 'admin' &&
        c.role !== 'superadmin' &&
        c.email?.toLowerCase() !== 'adarshpm0707@gmail.com' &&
        c.email?.toLowerCase() !== 'soshka.in@gmail.com' &&
        !c.email?.toLowerCase().includes('admin')
    );
  },

  /**
   * Delete a customer profile by ID.
   */
  async deleteCustomer(id) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log this action in admin activity log
    await adminLogService.logAction(
      'deleted_customer',
      'profiles',
      id,
      null
    );

    return true;
  }
};
