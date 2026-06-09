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
  const fetchProfile = async (userId) => {
    try {
      const userProfile = await authService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Check active session on mount
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await fetchProfile(currentUser.id);
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
        await fetchProfile(session.user.id);
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
  const register = async (email, password, name) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.signUp({ email, password, name });
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
        await fetchProfile(data.user.id);
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
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
