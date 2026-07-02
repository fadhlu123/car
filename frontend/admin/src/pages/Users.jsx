import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, X, Lock, Unlock, Ban, ShieldCheck } from 'lucide-react';
import { getUsers, getUserDetail, unlockUser, deactivateUser, activateUser } from '../services/admin.users.service';
import { formatDate } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';

const isLocked = (user) => user.locked_until && new Date(user.locked_until) > new Date();

const Users = () => {
  const { admin } = useAuth();
  const isOwner = admin?.admin_role === 'owner';

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [active, setActive]   = useState('');

  const [selected, setSelected]   = useState(null); // basic row data
  const [detail, setDetail]       = useState(null);  // { user, recent_activity }
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing]       = useState(false);

  const isSelf = detail?.user && (detail.user._id === admin?.sub || detail.user._id === admin?.id);

  const load = () => {
    setLoading(true);
    setError('');
    const params = {};
    if (search) params.search = search;
    if (role)   params.role   = role;
    if (active) params.active = active;
    getUsers(params)
      .then((d) => setUsers(d?.users || []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    load();
  };

  const openDetail = (user) => {
    setSelected(user);
    setDetail(null);
    setDetailLoading(true);
    getUserDetail(user._id)
      .then(setDetail)
      .catch((e) => alert(extractErrorMessage(e)))
      .finally(() => setDetailLoading(false));
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const patchLocalUser = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...patch } : u)));
    setDetail((prev) => (prev ? { ...prev, user: { ...prev.user, ...patch } } : prev));
  };

  const handleUnlock = async (id) => {
    setActing(true);
    try {
      await unlockUser(id);
      patchLocalUser(id, { failed_login_attempts: 0, locked_until: null });
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this account? This revokes all active sessions.')) return;
    setActing(true);
    try {
      await deactivateUser(id);
      patchLocalUser(id, { is_active: false });
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const handleActivate = async (id) => {
    setActing(true);
    try {
      await activateUser(id);
      patchLocalUser(id, { is_active: true });
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-primary-400 text-sm mt-1">Manage customer accounts</p>
        </div>
        <button onClick={load} className="btn-outline flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <form onSubmit={handleFilterSubmit} className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-grow min-w-[200px]">
          <label className="block text-xs text-primary-400 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
            <input
              className="input-field pl-9"
              placeholder="Name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-primary-400 mb-1">Role</label>
          <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-primary-400 mb-1">Status</label>
          <select className="input-field" value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>
        </div>
        <button type="submit" className="btn-primary text-sm">Apply</button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center text-primary-400">
          <p>No users found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-800 text-primary-400 text-left">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-800/50">
              {users.map((u) => {
                const fullName = `${u.profile?.first_name || ''} ${u.profile?.last_name || ''}`.trim() || u.email;
                return (
                  <tr
                    key={u._id}
                    onClick={() => openDetail(u)}
                    className="text-white cursor-pointer hover:bg-primary-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar url={u.profile?.avatar_url} name={fullName} size="w-9 h-9" />
                        <div>
                          <p className="font-medium">{fullName}</p>
                          <p className="text-xs text-primary-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize text-primary-300">{u.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${u.is_active ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-red-900/40 text-red-300 border-red-800'}`}>
                          {u.is_active ? 'Active' : 'Banned'}
                        </span>
                        {isLocked(u) && (
                          <span className="px-2 py-1 rounded-full text-xs border bg-yellow-900/40 text-yellow-300 border-yellow-800">Locked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary-400 text-xs">{formatDate(u.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={closeDetail} />
          <div className="relative bg-primary-900 border border-primary-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">User Detail</h2>
              <button onClick={closeDetail} className="text-primary-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <Avatar
                    url={detail?.user?.profile?.avatar_url}
                    name={`${detail?.user?.profile?.first_name || ''} ${detail?.user?.profile?.last_name || ''}`}
                    size="w-12 h-12"
                    iconSize="h-6 w-6"
                  />
                  <div>
                    <p className="text-white font-semibold">
                      {detail?.user?.profile?.first_name} {detail?.user?.profile?.last_name}
                      {isSelf && <span className="text-xs text-accent ml-2">(you)</span>}
                    </p>
                    <p className="text-primary-400 text-sm">{detail?.user?.email}</p>
                  </div>
                </div>
                <div>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs border ${detail?.user?.is_active ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-red-900/40 text-red-300 border-red-800'}`}>
                      {detail?.user?.is_active ? 'Active' : 'Banned'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${detail?.user?.email_verified ? 'bg-blue-900/40 text-blue-300 border-blue-800' : 'bg-primary-800 text-primary-400 border-primary-700'}`}>
                      {detail?.user?.email_verified ? 'Verified' : 'Unverified'}
                    </span>
                    {detail?.user && isLocked(detail.user) && (
                      <span className="px-2 py-1 rounded-full text-xs border bg-yellow-900/40 text-yellow-300 border-yellow-800">Locked</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {detail?.user && isLocked(detail.user) && (
                    <button
                      disabled={acting || !isOwner || isSelf}
                      onClick={() => handleUnlock(detail.user._id)}
                      title={isSelf ? "You can't modify your own account here" : !isOwner ? 'Owner only' : undefined}
                      className="btn-outline text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Unlock className="h-4 w-4" /> Unlock
                    </button>
                  )}
                  {detail?.user?.is_active ? (
                    <button
                      disabled={acting || !isOwner || isSelf}
                      onClick={() => handleDeactivate(detail.user._id)}
                      title={isSelf ? "You can't modify your own account here" : !isOwner ? 'Owner only' : undefined}
                      className="text-sm flex items-center gap-2 px-4 py-2 rounded-xl border border-red-800 text-red-300 hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Ban className="h-4 w-4" /> Ban
                    </button>
                  ) : (
                    <button
                      disabled={acting || !isOwner || isSelf}
                      onClick={() => handleActivate(detail.user._id)}
                      title={isSelf ? "You can't modify your own account here" : !isOwner ? 'Owner only' : undefined}
                      className="text-sm flex items-center gap-2 px-4 py-2 rounded-xl border border-green-800 text-green-300 hover:bg-green-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <ShieldCheck className="h-4 w-4" /> Unban
                    </button>
                  )}
                  {isSelf ? (
                    <p className="text-xs text-primary-500 w-full">This is your own account — these actions aren't available here.</p>
                  ) : !isOwner && (
                    <p className="text-xs text-primary-500 w-full">Only the account owner can lock/unlock or ban users.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary-500" /> Recent Activity
                  </h3>
                  {detail?.recent_activity?.length ? (
                    <ul className="space-y-2 max-h-56 overflow-y-auto">
                      {detail.recent_activity.map((a) => (
                        <li key={a._id} className="text-xs flex items-center justify-between border-b border-primary-800/50 pb-2">
                          <span className={a.success ? 'text-primary-300' : 'text-red-400'}>
                            {a.event.replace(/_/g, ' ')}
                          </span>
                          <span className="text-primary-500">{formatDate(a.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-primary-500">No activity recorded yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
