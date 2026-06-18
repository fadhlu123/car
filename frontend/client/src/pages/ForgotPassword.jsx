import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { forgotPassword } from '../services/auth.service';
import { extractErrorMessage } from '../utils/error.utils';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
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
            <KeyRound className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Forgot password?</h2>
          <p className="mt-2 text-primary-400 text-sm">
            Enter your email and we'll send you a reset code.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-800 text-green-300 text-sm rounded-lg px-4 py-3">
              Reset code sent! Check your email and continue below.
            </div>
            <Link to="/reset-password" className="btn-primary w-full block text-center">
              Enter Reset Code
            </Link>
          </div>
        ) : (
          <>
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
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-primary-400">
          <Link to="/login" className="text-accent hover:underline font-medium">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
