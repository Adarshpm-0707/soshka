import { supabase } from '../lib/supabaseClient';

export const authService = {
  /**
   * Register a new user with email and password.
   * Profiles table is automatically updated via database trigger.
   */
  async signUp({ email, password, name, phone = '', role = 'user' }) {
    const { data, error } = await supabase.rpc('register_user_directly', {
      p_email: email,
      p_password: password,
      p_name: name,
      p_role: role,
      p_phone: phone
    });

    if (error) throw error;

    if (data && data.success === false) {
      throw new Error(data.message || 'Registration failed.');
    }

    // Mock successful signup response object structure matching Supabase Auth schema
    return {
      user: {
        id: data.user_id,
        email: email,
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {
          name: name,
          role: role,
          phone: phone
        }
      },
      session: null
    };
  },

  /**
   * Log in a user with email and password.
   */
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  /**
   * Log out the current user.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get the current active session user.
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Listen for changes to auth state.
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  },

  /**
   * Sign in using Google OAuth.
   */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  /**
   * Fetch a user profile from the profiles table.
   */
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Update a user's profile details.
   */
  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Upload an avatar to Supabase Storage and update user profile.
   */
  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to 'avatars' storage bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile
    const profile = await this.updateUserProfile(userId, { avatar_url: publicUrl });
    return profile;
  }
};
