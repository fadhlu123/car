import React, { useState, useEffect } from 'react';
import { User, Key, Monitor, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, getSessions, revokeSession, changePassword } from '../services/auth.service';
import { formatDate } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    getProfile().then(updateUser).catch(() => {});
    if (tab === 'sessions') {
      getSessions().then(setSessions).catch(() => {});
    }
  }, [tab]);

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.new_password !== pwForm.confirm) return setPwError('Passwords do not match.');
    setPwLoading(true);
    try {
      await changePassword(pwForm.current_password, pwForm.new_password);
      setPwSuccess('Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwError(extractErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeSession(id);
      setSessions((s) => s.filter((sess) => sess._id !== id));
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Key },
    { id: 'sessions', label: 'Sessions', icon: Monitor },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">My Account</h1>

      <div className="flex gap-2 mb-8 border-b border-primary-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === id ? 'border-accent text-accent' : 'border-transparent text-primary-400 hover:text-white'}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6 max-w-lg">
          <div className="w-16 h-16 rounded-full bg-primary-800 flex items-center justify-center border border-primary-700 mb-4">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-primary-400" />
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-primary-500">Full Name</p>
              <p className="text-white font-medium">{user?.first_name} {user?.last_name}</p>
            </div>
            <div>
              <p className="text-xs text-primary-500">Email</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-primary-500">Email Verified</p>
              <p className={`font-medium text-sm ${user?.email_verified ? 'text-green-400' : 'text-yellow-400'}`}>
                {user?.email_verified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          </div>
          <button onClick={logout} className="mt-6 flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}

      {tab === 'password' && (
        <div className="card p-6 max-w-lg">
          <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
          {pwError && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{pwError}</div>}
          {pwSuccess && <div className="bg-green-900/30 border border-green-800 text-green-300 text-sm rounded-lg px-4 py-3 mb-4">{pwSuccess}</div>}
          <form onSubmit={handlePwSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-1">Current Password</label>
              <input type="password" required className="input-field" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-1">New Password</label>
              <input type="password" required minLength={8} className="input-field" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-1">Confirm New Password</label>
              <input type="password" required className="input-field" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary disabled:opacity-60">
              {pwLoading ? 'Saving...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-lg font-semibold text-white">Active Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-primary-400 text-sm">No active sessions found.</p>
          ) : (
            sessions.map((sess) => (
              <div key={sess._id} className="card p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white font-medium">{sess.user_agent || 'Unknown device'}</p>
                  <p className="text-xs text-primary-500 mt-1">Created {formatDate(sess.created_at)}</p>
                </div>
                <button onClick={() => handleRevoke(sess._id)} className="text-primary-500 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
