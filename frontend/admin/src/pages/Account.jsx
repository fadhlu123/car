import React, { useState, useEffect, useRef } from 'react';
import { User, Key, Monitor, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminProfile, getAdminSessions, changeAdminPassword, uploadAdminAvatar,
} from '../services/auth.service';
import { extractErrorMessage } from '../utils/error.utils';
import PasswordInput from '../components/ui/PasswordInput';
import TimeAgo from '../components/ui/TimeAgo';

const deviceLabel = (sess) => sess.device_info?.user_agent || sess.device_info?.device_type || 'Unknown device';

const Account = () => {
  const { admin, updateAdmin } = useAuth();
  const [tab, setTab] = useState('profile');
  const [activeSessions, setActiveSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    getAdminProfile().then(updateAdmin).catch(() => {});
    if (tab === 'sessions') {
      getAdminSessions()
        .then((d) => {
          setActiveSessions(d?.active || []);
          setPastSessions(d?.history || []);
        })
        .catch(() => {});
    }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const updated = await uploadAdminAvatar(file);
      updateAdmin(updated);
    } catch (err) {
      setAvatarError(extractErrorMessage(err));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwForm.new_password !== pwForm.confirm) return setPwError('Passwords do not match.');
    setPwLoading(true);
    try {
      await changeAdminPassword(pwForm.current_password, pwForm.new_password);
      setPwSuccess('Password changed successfully.');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwError(extractErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Key },
    { id: 'sessions', label: 'Sessions', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">My Account</h1>
        <p className="text-primary-400 text-sm mt-1">Your own admin profile, password, and sessions</p>
      </div>

      <div className="flex gap-2 border-b border-primary-800">
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
          <div className="relative w-16 h-16 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary-800 flex items-center justify-center border border-primary-700 overflow-hidden">
              {admin?.avatar_url ? (
                <img src={admin.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary-400" />
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent text-primary-950 flex items-center justify-center border-2 border-primary-900 hover:bg-accent-hover transition-colors disabled:opacity-60"
              title="Change profile picture"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          {avatarUploading && <p className="text-xs text-primary-400 mb-2">Uploading...</p>}
          {avatarError && <p className="text-xs text-red-400 mb-2">{avatarError}</p>}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-primary-500">Full Name</p>
              <p className="text-white font-medium">{admin?.first_name} {admin?.last_name}</p>
            </div>
            <div>
              <p className="text-xs text-primary-500">Email</p>
              <p className="text-white font-medium">{admin?.email}</p>
            </div>
            <div>
              <p className="text-xs text-primary-500">Role</p>
              <p className="text-white font-medium capitalize">{admin?.admin_role}</p>
            </div>
          </div>
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
              <PasswordInput required value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-1">New Password</label>
              <PasswordInput required minLength={8} value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-1">Confirm New Password</label>
              <PasswordInput required value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary disabled:opacity-60">
              {pwLoading ? 'Saving...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Active Sessions</h2>
              <p className="text-xs text-primary-500 mt-1">
                Signing in elsewhere automatically ends this session — that's why you'll usually see just one here.
              </p>
            </div>
            {activeSessions.length === 0 ? (
              <p className="text-primary-400 text-sm">No active sessions found.</p>
            ) : (
              activeSessions.map((sess) => (
                <div key={sess._id} className="card p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary-800 flex items-center justify-center flex-shrink-0">
                    <Monitor className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{deviceLabel(sess)}</p>
                    <p className="text-xs text-primary-500 mt-1">Started <TimeAgo date={sess.created_at} /></p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Past Sessions</h2>
            {pastSessions.length === 0 ? (
              <p className="text-primary-400 text-sm">No past sessions yet.</p>
            ) : (
              pastSessions.map((sess) => (
                <div key={sess._id} className="card p-4 flex items-center gap-4 opacity-70">
                  <div className="w-9 h-9 rounded-full bg-primary-800 flex items-center justify-center flex-shrink-0">
                    <Monitor className="h-4 w-4 text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{deviceLabel(sess)}</p>
                    <p className="text-xs text-primary-500 mt-1">
                      Started <TimeAgo date={sess.created_at} />
                      {sess.revoked_at ? <> · ended <TimeAgo date={sess.revoked_at} /></> : ' · expired'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
