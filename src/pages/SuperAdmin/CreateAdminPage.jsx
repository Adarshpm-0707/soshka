import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { Shield, ShieldAlert, Eye, EyeOff, Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import { showToast } from '../../components/Reusable/Toast';

const CreateAdminPage = () => {
  const navigate = useNavigate();
  const { createAdmin, loading } = useSuperAdmin();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [showPass, setShowPass] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!name.trim() || !email.trim() || !password) {
      setSubmitError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters.');
      return;
    }

    try {
      await createAdmin({
        email: email.trim(),
        password,
        name: name.trim(),
        role
      });
      navigate('/superadmin/admins');
    } catch (err) {
      console.error('Failed to create admin account:', err);
      setSubmitError(err.message || 'Failed to create admin profile.');
    }
  };

  return (
    <div className="space-y-6 text-white max-w-xl mx-auto">
      {/* Back button and Header */}
      <div className="space-y-4">
        <Link
          to="/superadmin/admins"
          className="inline-flex items-center text-xs font-bold text-slate-450 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Directory
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Provision Admin Account</h1>
          <p className="text-slate-450 text-xs mt-1 font-semibold">
            Create authority credentials for system operators or additional super administrators.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3 text-[#ff2a85] border-b border-[#1c1c1e] pb-4">
          <Shield size={22} />
          <h2 className="text-sm uppercase font-extrabold tracking-widest text-slate-200">Account Configuration</h2>
        </div>

        {submitError && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="adm-name" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Staff Full Name
            </label>
            <input
              id="adm-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Adarsh"
              disabled={loading}
              required
              className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-650"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="adm-email" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Staff Email Address
            </label>
            <input
              id="adm-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. adarsh@soshka.com"
              disabled={loading}
              required
              className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="adm-password" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Operator Password
            </label>
            <div className="relative">
              <input
                id="adm-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                disabled={loading}
                required
                className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-slate-655"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* System Role Selection */}
          <div className="space-y-1.5">
            <label htmlFor="adm-role" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Authority Privilege Role
            </label>
            <select
              id="adm-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-slate-300 rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-0"
            >
              <option value="admin">Administrator (Catalog/Offers/Orders access)</option>
              <option value="superadmin">Super Admin (Global billing/Admin configs access)</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#ff2a85] to-purple-650 hover:opacity-95 text-white transition-all duration-200 shadow-lg shadow-pink-500/15 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Provisioning Account...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Create Admin Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminPage;