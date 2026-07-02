import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, RefreshCw, Mail } from 'lucide-react';
import { getTeam, inviteMember, removeMember } from '../services/team.service';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/error.utils';
import { formatDate } from '../utils/format.utils';
import Avatar from '../components/ui/Avatar';

const ROLE_COLORS = {
  owner: 'bg-accent/20 text-accent border-accent/30',
  staff: 'bg-primary-800 text-primary-300 border-primary-700',
};

const Team = () => {
  const { admin } = useAuth();
  const isOwner = admin?.admin_role === 'owner';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail]     = useState('');
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    getTeam()
      .then((d) => setMembers(Array.isArray(d) ? d : []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setSending(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      await inviteMember(email);
      setInviteSuccess(`Invite sent to ${email}`);
      setEmail('');
    } catch (err) {
      setInviteError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the team? They will lose admin access.`)) return;
    try {
      await removeMember(id);
      setMembers((prev) => prev.filter((m) => m._id !== id && m.id !== id));
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-primary-400 text-sm mt-1">Manage your admin team members</p>
        </div>
        <button onClick={load} className="btn-outline flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Invite form — owner only */}
      {isOwner && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" /> Invite Team Member
          </h2>
          {inviteSuccess && (
            <div className="bg-green-900/30 border border-green-800 text-green-300 text-sm rounded-lg px-4 py-3 mb-4">{inviteSuccess}</div>
          )}
          {inviteError && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">{inviteError}</div>
          )}
          <form onSubmit={handleInvite} className="flex gap-3">
            <div className="flex-grow">
              <input
                type="email"
                required
                className="input-field"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2 flex-shrink-0 disabled:opacity-60">
              <Mail className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
          <p className="text-xs text-primary-500 mt-2">
            The invitee will receive an email with a link to set up their account.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
        </div>
      ) : members.length === 0 ? (
        <div className="card p-12 text-center text-primary-400">
          <p>No team members yet. Invite someone to get started.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-800 text-primary-400 text-left">
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                {isOwner && <th className="px-6 py-4 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-800/50">
              {members.map((m) => {
                const memberId = m._id || m.id;
                const isSelf = memberId === admin?.sub || memberId === admin?.id;
                const fullName = `${m.profile?.first_name || ''} ${m.profile?.last_name || ''}`.trim() || m.email;
                return (
                  <tr key={memberId} className="text-white">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar url={m.profile?.avatar_url} name={fullName} size="w-9 h-9" />
                        <div>
                          <p className="font-medium">{fullName} {isSelf && <span className="text-xs text-accent ml-1">(you)</span>}</p>
                          <p className="text-xs text-primary-500">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs border capitalize ${ROLE_COLORS[m.admin_role] || ROLE_COLORS.staff}`}>
                        {m.admin_role || 'staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-primary-400 text-xs">{formatDate(m.created_at)}</td>
                    {isOwner && (
                      <td className="px-6 py-4">
                        {!isSelf && m.admin_role !== 'owner' ? (
                          <button
                            onClick={() => handleRemove(memberId, fullName)}
                            className="p-1.5 text-primary-400 hover:text-red-400 hover:bg-primary-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-primary-700 text-xs">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Team;
