import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { resetPassword } from '../services/auth.service';
import { extractErrorMessage } from '../utils/error.utils';
import PasswordInput from '../components/ui/PasswordInput';

const ResetPassword = () => {
  const [form, setForm] = useState({ email: '', otp: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await resetPassword(form.email, form.otp, form.new_password);
      navigate('/login');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6 card p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Reset your password</h2>
          <p className="mt-2 text-primary-400 text-sm">Enter the code you received and choose a new password.</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Email address</label>
            <input name="email" type="email" required className="input-field" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Reset Code</label>
            <input
              name="otp"
              type="text"
              required
              maxLength={6}
              className="input-field text-center tracking-widest font-mono text-lg"
              placeholder="000000"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">New Password</label>
            <PasswordInput name="new_password" required minLength={8} value={form.new_password} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Confirm New Password</label>
            <PasswordInput name="confirm" required value={form.confirm} onChange={handleChange} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="text-center text-sm text-primary-400">
          <Link to="/login" className="text-accent hover:underline font-medium">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
