import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAuditLogs } from '../services/auth.service';
import { formatDate } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';

const AuditLog = () => {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [email, setEmail]     = useState('');
  const [event, setEvent]     = useState('');
  const [success, setSuccess] = useState('');

  const load = (targetPage = page) => {
    setLoading(true);
    setError('');
    const params = { page: targetPage, limit: 20 };
    if (email)   params.email   = email;
    if (event)   params.event   = event;
    if (success) params.success = success;
    getAuditLogs(params)
      .then((d) => {
        setLogs(d?.logs || []);
        setTotal(d?.total || 0);
        setPages(d?.pages || 1);
        setPage(d?.page || targetPage);
      })
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(1), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    load(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-primary-400 text-sm mt-1">{total} recorded event{total === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => load(page)} className="btn-outline flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <form onSubmit={handleFilterSubmit} className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-grow min-w-[200px]">
          <label className="block text-xs text-primary-400 mb-1">Email</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
            <input
              className="input-field pl-9"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-primary-400 mb-1">Event</label>
          <input
            className="input-field"
            placeholder="e.g. login_failed"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-primary-400 mb-1">Result</label>
          <select className="input-field" value={success} onChange={(e) => setSuccess(e.target.value)}>
            <option value="">All</option>
            <option value="true">Success</option>
            <option value="false">Failure</option>
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
      ) : logs.length === 0 ? (
        <div className="card p-12 text-center text-primary-400">
          <p>No audit events found.</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-800 text-primary-400 text-left">
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Event</th>
                  <th className="px-6 py-4 font-medium">Result</th>
                  <th className="px-6 py-4 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-800/50">
                {logs.map((log) => (
                  <tr key={log._id} className="text-white">
                    <td className="px-6 py-4 text-primary-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-6 py-4 text-primary-300">{log.email || '—'}</td>
                    <td className="px-6 py-4 capitalize">{log.event?.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs border ${log.success ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-red-900/40 text-red-300 border-red-800'}`}>
                        {log.success ? 'Success' : 'Failure'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-primary-500 text-xs">{log.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between text-sm text-primary-400">
              <span>Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                  className="btn-outline flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => load(page + 1)}
                  className="btn-outline flex items-center gap-1 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLog;
