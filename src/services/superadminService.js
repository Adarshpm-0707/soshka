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
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .update({
        created_by: currentUser?.id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', newUserId)
      .select();

    const profile = profiles?.[0] || null;

    if (profileErr) {
      console.warn('Profile update select error, falling back to direct update:', profileErr.message);
      await supabase
        .from('profiles')
        .update({
          created_by: currentUser?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', newUserId);
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
    let res = null;
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      console.warn('toggleAdminActive select error, falling back to direct update:', error.message);
      const { error: directErr } = await supabase
        .from('profiles')
        .update({ is_active: status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (directErr) throw directErr;
      res = { id, is_active: status };
    } else {
      res = data?.[0] || { id, is_active: status };
    }

    await adminLogService.logAction(
      status ? 'activated_admin' : 'deactivated_admin',
      'profiles',
      id,
      { is_active: status }
    );

    return res;
  },

  /**
   * Update the role of an admin.
   */
  async updateAdminRole(id, role) {
    let res = null;
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      console.warn('updateAdminRole select error, falling back to direct update:', error.message);
      const { error: directErr } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (directErr) throw directErr;
      res = { id, role };
    } else {
      res = data?.[0] || { id, role };
    }

    await adminLogService.logAction(
      'updated_admin_role',
      'profiles',
      id,
      { role }
    );

    return res;
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