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
      .eq('role', 'user')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    // Client-side fallback filter to ensure no admin/superadmin accounts show up in the customer section
    return (data || []).filter(
      (c) =>
        c.email &&
        !c.email.toLowerCase().includes('admin') &&
        c.email.toLowerCase() !== 'adarshpm0707@gmail.com'
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
