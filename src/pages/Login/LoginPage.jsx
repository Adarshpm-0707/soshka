import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validations';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';
import { supabase } from '../../lib/supabaseClient';

const LoginPage = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Destination path (defaults to root)
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client side validation
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      if (data?.user) {
        let userRole = 'user';
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          userRole = profileData?.role || 'user';
        } catch (err) {
          userRole = 'user';
        }

        if (userRole === 'admin' || userRole === 'superadmin') {
          await logout();
          setError('Access Denied: Please use the admin login portal to access your account.');
          showToast('Access Denied', 'error');
          return;
        }
      }
      showToast('Successfully logged in!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in. Check credentials.');
      showToast('Sign in failed', 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-850 p-8 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/80">
        
        {/* Title Header */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">
            Log in to manage your orders and profile
          </p>
        </div>

        {/* Form Error alert bar */}
        {error && (
          <div className="flex items-center space-x-2 p-3.5 bg-red-50/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-semibold animate-fade-in">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="you@example.com"
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

          <div className="flex items-center justify-end text-xs font-bold text-primary-600 dark:text-primary-400">
            <a href="#" className="hover:underline">Forgot password?</a>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Log In
          </Button>
        </form>



        <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-450">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
