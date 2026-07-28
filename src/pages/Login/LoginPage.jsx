import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldAlert, UserCheck, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { validateEmail } from '../../utils/validations';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';
import { supabase } from '../../lib/supabaseClient';

const LoginPage = () => {
  const { login, logout, loginWithGoogle, continueAsGuest } = useAuth();
  const { cartItems } = useCart();
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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.');
      showToast('Google sign in failed', 'error');
      setLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    continueAsGuest();
    if (cartItems && cartItems.length > 0) {
      showToast('Continuing as Guest! Proceeding to checkout.', 'success');
      const targetPath = (from && from !== '/') ? from : '/checkout';
      navigate(targetPath, { replace: true });
    } else {
      showToast('Guest mode active! Browse products to add items to cart.', 'success');
      const targetPath = (from && from !== '/' && from !== '/checkout') ? from : '/products';
      navigate(targetPath, { replace: true });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/80">
        
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

        {/* TOP SECTION: Sleek Compact Side-by-Side Guest & Google Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Guest Checkout Button (Left) */}
          <button
            type="button"
            onClick={handleGuestCheckout}
            className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-pink-500/30 bg-pink-500/10 hover:bg-[#ff2a85] text-xs font-extrabold uppercase tracking-wider text-[#ff2a85] hover:text-white transition-all duration-200 shadow-sm active:scale-95 group w-full"
          >
            <ShoppingBag className="w-4 h-4 shrink-0 text-[#ff2a85] group-hover:text-white transition-colors" />
            <span className="truncate">Guest</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Google Sign-In Button (Right) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-xs font-bold text-slate-750 dark:text-slate-200 hover:shadow-sm active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none w-full"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24c0-1.63-.15-3.2-.43-4.73H24v9.02h12.72c-.55 2.92-2.2 5.39-4.68 7.06l7.27 5.63C43.56 37.1 46.5 31.18 46.5 24z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.27-5.63c-2.03 1.37-4.63 2.19-8.62 2.19-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="#FBBC05" d="M10.54 28.84c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.54l7.98-6.19z"/>
            </svg>
            <span className="truncate">Google</span>
          </button>
        </div>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 border-t border-slate-200 dark:border-slate-800" />
          <span className="relative px-3 bg-white dark:bg-slate-850 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            or sign in with email
          </span>
        </div>

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

        <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-450 pt-2">
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
