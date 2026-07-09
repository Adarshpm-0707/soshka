import { supabase } from '../lib/supabaseClient';
import { adminLogService } from './adminLogService';

export const superadminService = {
  /**
   * Fetch all admin and superadmin profiles.
   */
  async fetchAllAdmins() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'superadmin'])
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new administrator account.
   */
  async createAdmin({ email, password, name, role = 'admin' }) {
    // Get current superadmin's ID
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    let registrationEmail = email.trim();
    if (role === 'admin' && !registrationEmail.includes('+admin')) {
      const parts = registrationEmail.split('@');
      registrationEmail = `${parts[0]}+admin@${parts[1]}`;
    } else if (role === 'superadmin' && !registrationEmail.includes('+superadmin')) {
      const parts = registrationEmail.split('@');
      registrationEmail = `${parts[0]}+superadmin@${parts[1]}`;
    }

    // Call the database function to register the user directly
    const { data, error } = await supabase.rpc('register_user_directly', {
      p_email: registrationEmail,
      p_password: password,
      p_name: name.trim(),
      p_role: role
    });

    if (error) throw error;
    if (data && data.success === false) {
      throw new Error(data.message || 'Registration failed.');
    }

    const newUserId = data.user_id;

    // Update the profile row to record who created it
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .update({
        created_by: currentUser?.id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', newUserId)
      .select()
      .single();

    if (profileErr) {
      throw new Error(`Failed to update database profile: ${profileErr.message}`);
    }

    // Log action
    await adminLogService.logAction(
      'created_admin',
      'profiles',
      newUserId,
      { name: name.trim(), email: email.trim(), role }
    );

    return profile || { id: newUserId, email, name, role, is_active: true };
  },

  /**
   * Toggle the active status of an admin account.
   */
  async toggleAdminActive(id, status) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await adminLogService.logAction(
      status ? 'activated_admin' : 'deactivated_admin',
      'profiles',
      id,
      { is_active: status }
    );

    return data;
  },

  /**
   * Update the role of an admin.
   */
  async updateAdminRole(id, role) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await adminLogService.logAction(
      'updated_admin_role',
      'profiles',
      id,
      { role }
    );

    return data;
  },

  /**
   * Delete an admin account.
   */
  async deleteAdmin(id) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await adminLogService.logAction(
      'deleted_admin',
      'profiles',
      id,
      null
    );

    return true;
  }
};