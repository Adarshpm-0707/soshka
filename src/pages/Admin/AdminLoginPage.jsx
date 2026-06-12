import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, LogIn } from 'lucide-react';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';

import { supabase } from '../../lib/supabaseClient';

const AdminLoginPage = () => {
  const { user, profile, login, logout, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Get the redirect path
  const from = location.state?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
    // If user is already logged in as admin, redirect
    if (user && profile?.role === 'admin') {
      navigate(from, { replace: true });
    }
  }, [user, profile, navigate, from]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!email || !password) {
      setSubmitError('Please enter both email and password.');
      return;
    }

    try {
      const data = await login(email, password);
      if (data.user) {
        let userRole = 'user';
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          userRole = profileData?.role || (data.user.email?.toLowerCase().includes('admin') || data.user.email === 'adarshpm0707@gmail.com' ? 'admin' : 'user');
        } catch (err) {
          // If query fails, fall back to email validation
          userRole = data.user.email?.toLowerCase().includes('admin') || data.user.email === 'adarshpm0707@gmail.com' ? 'admin' : 'user';
        }

        if (userRole === 'admin') {
          showToast('Welcome back, Admin!', 'success');
          navigate(from, { replace: true });
        } else {
          await logout();
          setSubmitError('Access Denied: You do not have administrator privileges.');
          showToast('Access Denied', 'error');
        }
      }
    } catch (err) {
      setSubmitError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-primary-950/40 border border-primary-800/20 text-[#ff2a85] rounded-2xl mb-2">
            <LogIn size={26} />
          </div>
          <h1 className="text-2xl font-black font-sans tracking-wide">Admin Portal</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Sign in to manage Soshka Store
          </p>
        </div>

        {submitError && (
          <div className="flex items-center space-x-2.5 p-3.5 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="admin@soshka.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 mt-2 font-bold text-sm bg-gradient-to-r from-primary-600 to-pink-600 hover:from-primary-700 hover:to-pink-700 border-none transition-all duration-300"
            loading={loading}
            disabled={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Need an admin account?{' '}
            <Link to="/admin/signup" className="text-[#ff2a85] font-bold hover:underline">
              Create Admin Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
