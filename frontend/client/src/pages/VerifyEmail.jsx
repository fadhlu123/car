import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { verifyEmail, resendVerification } from '../services/auth.service';
import { extractErrorMessage } from '../utils/error.utils';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmail(otp);
      navigate('/');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);
    try {
      await resendVerification();
      setSuccess('A new code has been sent to your email.');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6 card p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Verify your email</h2>
          <p className="mt-2 text-primary-400 text-sm">
            We sent a 6-digit code to your email. Enter it below to activate your account.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/30 border border-green-800 text-green-300 text-sm rounded-lg px-4 py-3">
            {success}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1">Verification Code</label>
            <input
              type="text"
              required
              maxLength={6}
              className="input-field text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <p className="text-center text-sm text-primary-400">
          Didn&apos;t receive a code?{' '}
          <button onClick={handleResend} disabled={resending} className="text-accent hover:underline font-medium disabled:opacity-60">
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
