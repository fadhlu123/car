import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/error.utils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (!data.user?.email_verified) {
        navigate('/verify-email');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const data = await loginWithGoogle(credentialResponse.credential);
      navigate(data.user?.email_verified === false ? '/verify-email' : from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6 card p-8">
        <div className="text-center">
          <Car className="h-10 w-10 text-accent mx-auto mb-2" />
          <h2 className="text-3xl font-extrabold text-white">Sign in</h2>
          <p className="mt-1 text-primary-400 text-sm">Welcome back to Auto Majid</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Email address</label>
            <input
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Password</label>
            <input
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px bg-primary-800 flex-grow" />
          <span className="text-xs text-primary-500">OR</span>
          <div className="h-px bg-primary-800 flex-grow" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed. Please try again.')}
            theme="filled_black"
            shape="pill"
          />
        </div>

        <p className="text-center text-sm text-primary-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-accent hover:underline font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
