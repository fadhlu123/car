import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { register } from '../services/auth.service';
import { storeAuth } from '../utils/storage.utils';
import { extractErrorMessage } from '../utils/error.utils';

const Register = () => {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const data = await register(form.email, form.password, form.first_name, form.last_name);
      storeAuth(data);
      navigate('/verify-email');
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
          <Car className="h-10 w-10 text-accent mx-auto mb-2" />
          <h2 className="text-3xl font-extrabold text-white">Create an account</h2>
          <p className="mt-1 text-primary-400 text-sm">Join Auto Majid today</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-1">First Name</label>
              <input name="first_name" type="text" required className="input-field" value={form.first_name} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-1">Last Name</label>
              <input name="last_name" type="text" required className="input-field" value={form.last_name} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Email address</label>
            <input name="email" type="email" required className="input-field" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Password</label>
            <input name="password" type="password" required minLength={8} className="input-field" value={form.password} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Confirm Password</label>
            <input name="confirm" type="password" required className="input-field" value={form.confirm} onChange={handleChange} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-primary-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
