import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validateRegisterForm } from '../../utils/validations';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';

const RegisterPage = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    // Admin separation check
    if (email.toLowerCase().includes('admin') || email.toLowerCase() === 'adarshpm0707@gmail.com') {
      setGeneralError("Emails containing 'admin' or system operators are reserved for administrative accounts. Please sign up using a customer email address.");
      showToast('Registration Denied', 'error');
      return;
    }

    // Validation
    const validation = validateRegisterForm({ name, email, phone, password, confirmPassword });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name, 'user', phone);
      showToast('Registration successful! Please check your email.', 'success');
      navigate('/login');
    } catch (err) {
      setGeneralError(err.message || 'Registration failed. Try again.');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGeneralError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setGeneralError(err.message || 'Failed to sign up with Google.');
      showToast('Google sign up failed', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/80">
        
        {/* Title Header */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-semibold">
            Sign up to start shopping on Soshka
          </p>
        </div>

        {/* General Error alert bar */}
        {generalError && (
          <div className="flex items-center space-x-2 p-3.5 bg-red-50/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-semibold animate-fade-in">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
            disabled={loading}
          />

          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
            disabled={loading}
          />

          <Input
            label="Phone Number (10 digits)"
            id="phone"
            type="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            required
            disabled={loading}
          />

          <Input
            label="Password (min 6 characters)"
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
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
            error={errors.confirmPassword}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            loading={loading}
            disabled={loading}
          >
            Register
          </Button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 border-t border-slate-200 dark:border-slate-800" />
          <span className="relative px-3 bg-white dark:bg-slate-850 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            or continue with
          </span>
        </div>

        <div className="mb-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-750 dark:text-slate-200 hover:shadow-sm active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none w-full"
          >
            <svg className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24c0-1.63-.15-3.2-.43-4.73H24v9.02h12.72c-.55 2.92-2.2 5.39-4.68 7.06l7.27 5.63C43.56 37.1 46.5 31.18 46.5 24z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.27-5.63c-2.03 1.37-4.63 2.19-8.62 2.19-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="#FBBC05" d="M10.54 28.84c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.54l7.98-6.19z"/>
            </svg>
            <span>Google</span>
          </button>
        </div>

        <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-450">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
