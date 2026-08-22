import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, Crown, UserPlus, Mail, RefreshCw, Eye, EyeOff, KeyRound } from 'lucide-react';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';
import { supabase } from '../../lib/supabaseClient';
import { adminLogService } from '../../services/adminLogService';

const SuperAdminLoginPage = () => {
  const { user, profile, login, logout, loading, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const from = location.state?.from?.pathname || '/superadmin/dashboard';

  useEffect(() => {
    if (user && profile?.is_active !== false) {
      if (profile?.role === 'superadmin') {
        navigate(from, { replace: true });
      } else if (profile?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, profile, navigate, from]);

  useEffect(() => {
    return () => { clearError(); };
  }, [clearError]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendConfirmation = async () => {
    if (!email || resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    try {
      let resendEmail = email.trim();
      if (!resendEmail.includes('+superadmin')) {
        const parts = resendEmail.split('@');
        resendEmail = `${parts[0]}+superadmin@${parts[1]}`;
      }
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: { emailRedirectTo: `${window.location.origin}/superadmin/login` }
      });
      if (error) throw error;
      showToast('Confirmation email resent! Check your inbox.', 'success');
      setResendCooldown(60);
    } catch (err) {
      showToast(err.message || 'Failed to resend email. Try again later.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Please enter your email address.', 'error');
      return;
    }
    setResetLoading(true);
    try {
      let transformedEmail = resetEmail.trim();
      if (!transformedEmail.includes('+superadmin')) {
        const parts = transformedEmail.split('@');
        transformedEmail = `${parts[0]}+superadmin@${parts[1]}`;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(transformedEmail, {
        redirectTo: `${window.location.origin}/superadmin/login`
      });
      if (error) throw error;
      setResetSent(true);
      showToast('Password reset link sent! Check your inbox.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send reset email.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setEmailNotConfirmed(false);

    if (!email || !password) {
      setSubmitError('Please enter both email and password.');
      return;
    }

    const baseEmail = email.trim();
    let loginEmail = baseEmail;
    if (!loginEmail.includes('+superadmin')) {
      const parts = loginEmail.split('@');
      loginEmail = `${parts[0]}+superadmin@${parts[1]}`;
    }

    let data;
    try {
      // First try logging in with +superadmin suffix
      data = await login(loginEmail, password);
    } catch (err) {
      // If +superadmin login fails and original email did not have +superadmin, try base email
      const msg = err.message || '';
      const isEmailVerificationError = msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed');
      
      if (isEmailVerificationError) {
        setEmailNotConfirmed(true);
        setSubmitError('');
        return;
      }

      if (!baseEmail.includes('+superadmin')) {
        try {
          data = await login(baseEmail, password);
        } catch (fallbackErr) {
          const fallbackMsg = fallbackErr.message || '';
          if (fallbackMsg.toLowerCase().includes('email not confirmed') || fallbackMsg.toLowerCase().includes('not confirmed')) {
            setEmailNotConfirmed(true);
            setSubmitError('');
          } else if (fallbackMsg.toLowerCase().includes('invalid login') || fallbackMsg.toLowerCase().includes('invalid credentials')) {
            setSubmitError('Incorrect email or password. Please try again.');
            setShowForgotPassword(false);
          } else {
            setSubmitError(fallbackMsg || 'Login failed. Please check your credentials.');
          }
          return;
        }
      } else {
        if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
          setSubmitError('Incorrect email or password. Please try again.');
          setShowForgotPassword(false);
        } else {
          setSubmitError(msg || 'Login failed. Please check your credentials.');
        }
        return;
      }
    }

    if (data && data.user) {
      let profileData = null;
      try {
        const { data: pData, error: pErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
        if (!pErr) profileData = pData;
        else console.warn('Profile fetch error:', pErr.message);
      } catch (err) {
        console.error('Error fetching super admin profile:', err);
      }

      const isSuperAdminUser = profileData?.role === 'superadmin';
      const isAdminUser = profileData?.role === 'admin';
      const isActive = profileData?.is_active !== false;

      if (isSuperAdminUser && isActive) {
        showToast('Welcome, Super Administrator!', 'success');
        await adminLogService.logAction('logged_in', 'profiles', data.user.id, { email: baseEmail, role: 'superadmin' });
        navigate(from, { replace: true });
      } else if (isAdminUser && isActive) {
        showToast('Welcome back, Administrator! Redirecting to Admin Portal...', 'success');
        await adminLogService.logAction('logged_in', 'profiles', data.user.id, { email: baseEmail, role: 'admin' });
        navigate('/admin/dashboard', { replace: true });
      } else if (profileData && !isActive) {
        await logout();
        setSubmitError('Access Denied: Your account has been suspended or deactivated.');
        showToast('Account Suspended', 'error');
      } else if (profileData && !isSuperAdminUser && !isAdminUser) {
        await logout();
        setSubmitError('Access Denied: You do not have administrator privileges.');
        showToast('Access Denied', 'error');
      } else {
        await logout();
        setSubmitError(
          'Login failed: user profile not found. Please ensure the database schema is up to date, or contact support.'
        );
      }
    }
  };

  // ── Forgot Password View ──
  if (showForgotPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 bg-pink-950/40 border border-pink-500/20 text-[#ff2a85] rounded-2xl mb-2">
              <KeyRound size={26} />
            </div>
            <h1 className="text-2xl font-black font-sans tracking-wide">Reset Password</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Send a reset link to your email
            </p>
          </div>

          {resetSent ? (
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-center space-y-3">
              <Mail size={28} className="mx-auto text-emerald-400" />
              <p className="font-bold text-sm">Reset Link Sent!</p>
              <p className="text-xs text-emerald-400/80">
                Check your inbox at <strong>{resetEmail}</strong> and click the reset link.
              </p>
              <button
                onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
                className="text-[11px] text-slate-400 hover:text-white underline transition-colors mt-1"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Your Super Admin Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="superadmin@soshka.com"
                  required
                  className="w-full bg-[#121214] border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-600"
                />
              </div>
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#ff2a85] to-purple-600 hover:opacity-95 text-white transition-all duration-200 shadow-lg shadow-pink-500/15 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {resetLoading ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
              >
                ← Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Main Login View ──
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-8 shadow-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-pink-950/40 border border-pink-850/20 text-[#ff2a85] rounded-2xl mb-2 relative">
            <Crown size={26} />
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </div>
          </div>
          <h1 className="text-2xl font-black font-sans tracking-wide text-white">Super Admin</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Sõshka Enterprise Authority Portal
          </p>
        </div>

        {/* Error */}
        {submitError && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <div>
              <span>{submitError}</span>
              {(submitError.includes('Incorrect') || submitError.includes('Invalid') || submitError.includes('credentials')) && (
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}
                  className="block mt-1.5 text-[11px] text-red-300 hover:text-white underline transition-colors"
                >
                  Forgot your password? Reset it here →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Email not confirmed banner */}
        {emailNotConfirmed && (
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 text-amber-300 rounded-xl space-y-3">
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="shrink-0 text-amber-400" />
              <div>
                <p className="font-bold text-xs text-amber-300">Email Not Confirmed</p>
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  Please confirm your email before logging in. Check your inbox for the verification link.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendLoading || resendCooldown > 0}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={12} className={resendLoading ? 'animate-spin' : ''} />
              {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Confirmation Email'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Super Admin Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="superadmin@soshka.com"
              required
              disabled={loading}
              className="w-full bg-[#121214] border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-600 disabled:opacity-50"
            />
          </div>

          {/* Password with show/hide toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Secret Key Password
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}
                className="text-[10px] text-[#ff2a85] hover:text-pink-300 font-bold transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full bg-[#121214] border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-slate-600 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 mt-2 font-bold text-sm bg-gradient-to-r from-[#ff2a85] to-purple-650 hover:from-pink-650 hover:to-purple-700 border-none transition-all duration-300 shadow-lg shadow-pink-500/10"
            loading={loading}
            disabled={loading}
          >
            Authenticate Portal
          </Button>
        </form>



      </div>
    </div>
  );
};

export default SuperAdminLoginPage;