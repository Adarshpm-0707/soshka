import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  // Helper to fetch profile details once user is known
  const fetchProfile = async (userId, email) => {
    try {
      const userProfile = await authService.getUserProfile(userId);
      // Fallback: If role column doesn't exist in profiles, check email
      if (userProfile && !userProfile.role && (email?.toLowerCase().includes('admin') || email === 'adarshpm0707@gmail.com')) {
        userProfile.role = 'admin';
      }
      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      // Fallback: Mock profile if email contains admin or is whitelisted
      if (email?.toLowerCase().includes('admin') || email === 'adarshpm0707@gmail.com') {
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
      setLoading(true);
      if (session?.user) {
        setUser(session.user);
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
      await authService.signInWithGoogle();
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
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin' || user?.email === 'adarshpm0707@gmail.com';

  const value = {
    user,
    profile,
    loading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    updateProfile,
    uploadAvatar,
    clearError,
    isAdmin,
    isSuperAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
