import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, UserPlus } from 'lucide-react';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';

const AdminSignupPage = () => {
  const { user, profile, register, loading, clearError } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!name || !email || !password || !confirmPassword) {
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

    try {
      await register(email, password, name, 'admin');
      showToast('Admin account created successfully!', 'success');
      navigate('/admin/login');
    } catch (err) {
      setSubmitError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-primary-950/40 border border-primary-800/20 text-[#ff2a85] rounded-2xl mb-2">
            <UserPlus size={26} />
          </div>
          <h1 className="text-2xl font-black font-sans tracking-wide">Create Admin</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Register a new administrator account
          </p>
        </div>

        {submitError && (
          <div className="flex items-center space-x-2.5 p-3.5 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
            <ShieldCheck size={16} className="shrink-0 text-red-400" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />

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

          <Input
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            Register Admin
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Already have an admin account?{' '}
            <Link to="/admin/login" className="text-[#ff2a85] font-bold hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSignupPage;
