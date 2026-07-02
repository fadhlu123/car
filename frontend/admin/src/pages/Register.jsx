import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/error.utils';
import PasswordInput from '../components/ui/PasswordInput';

const Register = () => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    registration_key: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(
        form.first_name,
        form.last_name,
        form.email,
        form.password,
        form.registration_key
      );
      navigate('/');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-950 px-4 py-10">
      <div className="max-w-md w-full card p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 bg-primary-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Create Admin Account</h2>
          <p className="text-primary-400 text-sm mt-1">Auto Majid Management</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-1">First Name</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="John"
                value={form.first_name}
                onChange={set('first_name')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-1">Last Name</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Doe"
                value={form.last_name}
                onChange={set('last_name')}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="admin@example.com"
              value={form.email}
              onChange={set('email')}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Password</label>
            <PasswordInput
              required
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Confirm Password</label>
            <PasswordInput
              required
              placeholder="Repeat password"
              value={form.confirm_password}
              onChange={set('confirm_password')}
            />
          </div>

          {/* Registration Key */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">
              Registration Key
              <span className="ml-2 text-xs text-primary-500">(provided by your system owner)</span>
            </label>
            <PasswordInput
              required
              placeholder="Secret key"
              value={form.registration_key}
              onChange={set('registration_key')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating account…' : 'Create Admin Account'}
          </button>
        </form>

        <p className="text-center text-sm text-primary-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
