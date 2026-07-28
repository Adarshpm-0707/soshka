import React, { createContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isGuest, setIsGuest] = useState(() => {
    try {
      return sessionStorage.getItem('soshka_is_guest') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guest actions
  const continueAsGuest = () => {
    try {
      sessionStorage.setItem('soshka_is_guest', 'true');
    } catch (e) {
      console.error('Failed to set guest session:', e);
    }
    setIsGuest(true);
    setError(null);
    return true;
  };

  const exitGuestMode = () => {
    try {
      sessionStorage.removeItem('soshka_is_guest');
    } catch (e) {
      console.error('Failed to remove guest session:', e);
    }
    setIsGuest(false);
  };

  // Keep a ref to the current user state to avoid stale closures in the useEffect subscription callback
  const currentUserRef = useRef(null);
  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  const clearError = () => setError(null);

  // Helper to fetch profile details once user is known
  const fetchProfile = async (userId, email) => {
    try {
      const userProfile = await authService.getUserProfile(userId);
      // Fallback: If role column doesn't exist in profiles, check email
      if (userProfile && !userProfile.role && (email?.toLowerCase().includes('admin') || email === 'adarshpm0707@gmail.com' || email === 'soshka.in@gmail.com')) {
        userProfile.role = 'admin';
      }
      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      // Fallback: Mock profile if email contains admin or is whitelisted
      if (email?.toLowerCase().includes('admin') || email === 'adarshpm0707@gmail.com' || email === 'soshka.in@gmail.com') {
        setProfile({
          id: userId,
          role: 'admin',
          name: email.split('@')[0],
          email: email
        });
      } else {
        setProfile(null);
      }
    }
  };

  // Upsert profile row for OAuth users (Google/Apple) who may not have one
  const upsertOAuthProfile = async (user) => {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Customer';
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name,
        avatar_url: avatarUrl,
        role: 'user',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: false });
    } catch (err) {
      console.error('Error upserting OAuth profile:', err.message);
    }
  };

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await fetchProfile(currentUser.id, currentUser.email);
        }
      } catch (err) {
        console.error('Auth initialization error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const subscription = authService.onAuthStateChange(async (event, session) => {
      // Only set loading to true for initial sign-in events when we don't have a user loaded
      // to avoid background token refreshes (e.g., on window/tab focus) from triggering a full reload.
      const isInitialSignIn = (event === 'SIGNED_IN' && !currentUserRef.current);
      if (isInitialSignIn) {
        setLoading(true);
      }
      
      if (session?.user) {
        setUser(session.user);
        // For OAuth providers (Google, Apple), ensure profile row exists
        const provider = session.user.app_metadata?.provider;
        if (event === 'SIGNED_IN' && (provider === 'google' || provider === 'apple')) {
          await upsertOAuthProfile(session.user);
        }
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Action: Register
  const register = async (email, password, name, role = 'user', phone = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.signUp({ email, password, name, phone, role });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Action: Login
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.signIn({ email, password });
      setUser(data.user);
      if (data.user) {
        exitGuestMode();
        await fetchProfile(data.user.id, data.user.email);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Action: Sign Out
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
      exitGuestMode();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Action: Login with Google
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      exitGuestMode();
      await authService.signInWithGoogle();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Action: Login with Apple
  const loginWithApple = async () => {
    setLoading(true);
    setError(null);
    try {
      exitGuestMode();
      await authService.signInWithApple();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Action: Update Profile Details
  const updateProfile = async (updates) => {
    if (!user) throw new Error('No authenticated user');
    setLoading(true);
    setError(null);
    try {
      const updatedProfile = await authService.updateUserProfile(user.id, updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Action: Upload Avatar
  const uploadAvatar = async (file) => {
    if (!user) throw new Error('No authenticated user');
    setLoading(true);
    setError(null);
    try {
      const updatedProfile = await authService.uploadAvatar(user.id, file);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = profile?.role === 'superadmin';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin' || user?.email === 'adarshpm0707@gmail.com' || user?.email === 'soshka.in@gmail.com';

  const value = {
    user,
    profile,
    isGuest,
    loading,
    error,
    login,
    register,
    logout,
    continueAsGuest,
    exitGuestMode,
    loginWithGoogle,
    loginWithApple,
    updateProfile,
    uploadAvatar,
    clearError,
    isAdmin,
    isSuperAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
