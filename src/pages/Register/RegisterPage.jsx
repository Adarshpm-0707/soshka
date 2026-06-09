import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validateRegisterForm } from '../../utils/validations';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    // Validation
    const validation = validateRegisterForm({ name, email, password, confirmPassword });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      showToast('Registration successful! Please check your email.', 'success');
      navigate('/login');
    } catch (err) {
      setGeneralError(err.message || 'Registration failed. Try again.');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-850 p-8 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/80">
        
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
