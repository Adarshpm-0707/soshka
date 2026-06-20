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

    // Call Supabase Auth signUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Account signup succeeded, but user data is unavailable.');

    const newUserId = data.user.id;

    // Insert/upsert into profiles table to link roles and assign created_by fields
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: newUserId,
        name,
        email,
        role,
        is_active: true,
        created_by: currentUser?.id || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileErr) {
      console.warn('Failed to upsert user profile:', profileErr.message);
    }

    // Log action
    await adminLogService.logAction(
      'created_admin',
      'profiles',
      newUserId,
      { name, email, role }
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