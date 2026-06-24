import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Car, CheckCircle } from 'lucide-react';
import { getInviteInfo, acceptInvite } from '../services/team.service';
import { extractErrorMessage } from '../utils/error.utils';

const readInviteTokenFromPath = () => {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/\/accept-invite\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const formatInviter = (invitedBy) => {
  if (!invitedBy) return '';
  if (typeof invitedBy === 'string') return invitedBy;
  if (typeof invitedBy === 'object') {
    return invitedBy.name || invitedBy.email || '';
  }
  return '';
};

const AcceptInvite = () => {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Token can be in URL path (/accept-invite/:token) or query (?token=xxx)
  const token = paramToken || searchParams.get('token') || readInviteTokenFromPath();

  const [info, setInfo]       = useState(null);
  const [infoError, setInfoError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  useEffect(() => {
    if (!token) {
      setInfoError('No invite token found in URL.');
      setLoading(false);
      return;
    }
    getInviteInfo(token)
      .then(setInfo)
      .catch((e) => setInfoError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await acceptInvite({
        token,
        first_name: form.first_name,
        last_name:  form.last_name,
        password:   form.password,
      });
      setDone(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="h-8 w-8 text-accent" />
            <span className="font-bold text-white text-xl">Auto <span className="text-accent">Majid</span></span>
          </div>
        </div>

        <div className="card p-8">
          {infoError ? (
            <div className="text-center">
              <p className="text-red-400 text-sm mb-4">{infoError}</p>
              <p className="text-primary-500 text-sm">This invite may have expired or already been used.</p>
            </div>
          ) : done ? (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
              <p className="text-primary-400 text-sm mb-6">You can now log in to the admin panel with your credentials.</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full">Go to Login</button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Accept Invite</h2>
                {info?.invited_by && (
                  <p className="text-primary-400 text-sm">
                    You were invited by <span className="text-white">{formatInviter(info.invited_by)}</span> to join Auto Majid as an admin.
                  </p>
                )}
              </div>

              {info?.email && (
                <div className="bg-primary-800/40 border border-primary-700 rounded-xl px-4 py-3 mb-5">
                  <p className="text-xs text-primary-400">Invite email</p>
                  <p className="text-white text-sm font-medium">{info.email}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-primary-400 mb-1">First Name</label>
                    <input name="first_name" required className="input-field" value={form.first_name} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs text-primary-400 mb-1">Last Name</label>
                    <input name="last_name" required className="input-field" value={form.last_name} onChange={handleChange} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-primary-400 mb-1">Password</label>
                  <input name="password" type="password" required minLength={8} className="input-field" value={form.password} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs text-primary-400 mb-1">Confirm Password</label>
                  <input name="confirm" type="password" required className="input-field" value={form.confirm} onChange={handleChange} />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
                  {submitting ? 'Setting up account...' : 'Create Account & Join'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
