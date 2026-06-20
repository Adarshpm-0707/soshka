import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Crown, Eye, EyeOff, Loader2, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { showToast } from '../../components/Reusable/Toast';
import { authService } from '../../services/authService';

const SuperAdminSignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailConfirmRequired, setEmailConfirmRequired] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setSubmitError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Sign up via authService (which uses register_user_directly RPC)
      const data = await authService.signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        role: 'superadmin'
      });

      // Step 2: Upsert the profile row with superadmin role.
      // We do this regardless of email confirmation status so the role is persisted immediately.
      if (data?.user) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              name: name.trim(),
              email: email.trim(),
              role: 'superadmin',
              is_active: true,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'id' }
          );

        if (profileErr) {
          // Non-fatal — trigger may handle it, log but continue
          console.warn('Profile upsert warning:', profileErr.message);
        }

        // Case A: Email confirmation is disabled in Supabase project settings
        // In this case, data.session is populated immediately OR email_confirmed_at is set
        if (data.session || data.user.email_confirmed_at) {
          setSuccess(true);
          showToast('Super Admin account created! You can now log in.', 'success');
          // Short delay so user sees the success state, then redirect
          setTimeout(() => navigate('/superadmin/login'), 1800);
          return;
        }

        // Case B: Email confirmation IS required — user exists but session is null
        // The profile row is already saved. Show a "go login" screen.
        setEmailConfirmRequired(true);
        setSuccess(true);
        showToast('Account created! Check your email to confirm, then log in.', 'success');
        return;
      }

      // Fallback
      setSuccess(true);

    } catch (err) {
      console.error('Signup error:', err);
      setSubmitError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="inline-flex p-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-2xl">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-black text-white">Account Created!</h2>

          {emailConfirmRequired ? (
            <p className="text-sm text-slate-400 leading-relaxed">
              A confirmation link was sent to{' '}
              <span className="text-white font-bold">{email}</span>.
              <br />
              Click the link in the email to activate your account, then log in.
            </p>
          ) : (
            <p className="text-sm text-slate-400 leading-relaxed">
              Your Super Admin account has been created successfully.
              <br />
              Redirecting you to the login page…
            </p>
          )}

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <Link
              to="/superadmin/login"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-[#ff2a85] to-purple-600 text-white text-sm font-extrabold hover:opacity-90 transition-all duration-200 shadow-lg shadow-pink-500/10"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-8 shadow-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-pink-950/40 border border-pink-500/20 text-[#ff2a85] rounded-2xl mb-2 relative">
            <Crown size={26} />
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </div>
          </div>
          <h1 className="text-2xl font-black font-sans tracking-wide text-white">Register Super Admin</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Establish new Enterprise authority credentials
          </p>
        </div>

        {submitError && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="sa-name" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Full Name <span className="text-[#ff2a85]">*</span>
            </label>
            <input
              id="sa-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Super Admin Name"
              disabled={loading}
              required
              autoComplete="name"
              className="w-full bg-[#121214] border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-600"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="sa-email" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Super Admin Email <span className="text-[#ff2a85]">*</span>
            </label>
            <input
              id="sa-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@soshka.com"
              disabled={loading}
              required
              autoComplete="email"
              className="w-full bg-[#121214] border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-600"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="sa-password" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Password <span className="text-[#ff2a85]">*</span>
            </label>
            <div className="relative">
              <input
                id="sa-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                disabled={loading}
                required
                autoComplete="new-password"
                className="w-full bg-[#121214] border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="sa-confirm" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Confirm Password <span className="text-[#ff2a85]">*</span>
            </label>
            <div className="relative">
              <input
                id="sa-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                disabled={loading}
                required
                autoComplete="new-password"
                className="w-full bg-[#121214] border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] text-red-400 font-semibold mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#ff2a85] to-purple-600 hover:opacity-95 hover:-translate-y-0.5 text-white transition-all duration-200 shadow-lg shadow-pink-500/15 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Register Account
              </>
            )}
          </button>
        </form>

        <div className="border-t border-slate-800/80 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Already have authority credentials?{' '}
            <Link to="/superadmin/login" className="text-[#ff2a85] font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSignupPage;