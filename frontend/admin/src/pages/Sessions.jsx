import React, { useState, useEffect } from 'react';
import { Monitor, RefreshCw } from 'lucide-react';
import { getAdminSessions } from '../services/auth.service';
import { formatDate } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getAdminSessions()
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Sessions</h1>
          <p className="text-primary-400 text-sm mt-1">Devices currently signed in to your admin account</p>
        </div>
        <button onClick={load} className="btn-outline flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card p-12 text-center text-primary-400">
          <p>No active sessions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => (
            <div key={sess._id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center flex-shrink-0">
                <Monitor className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{sess.user_agent || 'Unknown device'}</p>
                <p className="text-xs text-primary-500 mt-1">Created {formatDate(sess.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sessions;
