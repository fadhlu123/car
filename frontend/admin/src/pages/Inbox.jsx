import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Send, MessageSquare } from 'lucide-react';
import { listConversations, getConversation, sendReply, markSeen } from '../services/contact.service';
import { useAdminSSE } from '../hooks/useAdminSSE';
import { extractErrorMessage } from '../utils/error.utils';

const timeOf = (dateString) =>
  new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const Inbox = () => {
  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading]     = useState(true);
  const [error, setError]                 = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft]     = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadConversations = () => {
    setListLoading(true);
    setError('');
    listConversations({ limit: 50 })
      .then((d) => setConversations(d?.conversations || []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setListLoading(false));
  };

  useEffect(loadConversations, []);

  const openConversation = (id) => {
    setSelectedId(id);
    setThreadLoading(true);
    getConversation(id)
      .then((c) => setMessages(c.messages || []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setThreadLoading(false));
    markSeen(id).then(() => {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: false } : c)));
    }).catch(() => {});
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useAdminSSE({
    chat_message: (payload) => {
      if (!payload?.message) return;
      if (payload.conversation_id === selectedId) {
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === payload.message.id);
          if (idx === -1) return [...prev, payload.message];
          const next = [...prev];
          next[idx] = payload.message;
          return next;
        });
      }
      // Refresh the list so previews/unread badges and ordering stay current
      loadConversations();
    },
  });

  const handleReply = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !selectedId) return;
    setSending(true);
    setError('');
    try {
      const message = await sendReply(selectedId, draft.trim());
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <p className="text-primary-400 text-sm mt-1">Customer conversations</p>
        </div>
        <button onClick={loadConversations} className="btn-outline flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[34rem]">
        {/* Conversation list */}
        <div className="card overflow-y-auto lg:col-span-1">
          {listLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-primary-500 text-sm py-10 px-4">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-primary-800/50">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => openConversation(c.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-primary-800/40 transition-colors ${selectedId === c.id ? 'bg-primary-800/60' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{c.user.name}</p>
                      {c.unread && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
                    </div>
                    <p className="text-xs text-primary-500 truncate">{c.user.email}</p>
                    <p className="text-xs text-primary-400 truncate mt-1">{c.last_message_preview || '—'}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Thread */}
        <div className="card flex flex-col lg:col-span-2">
          {!selectedId ? (
            <div className="flex-grow flex flex-col items-center justify-center text-primary-500">
              <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-primary-800">
                <h2 className="text-sm font-semibold text-white">{selected?.user?.name}</h2>
                <p className="text-xs text-primary-500">{selected?.user?.email}</p>
              </div>

              <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
                {threadLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwn = m.sender_type === 'admin';
                    return (
                      <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isOwn ? 'bg-accent text-primary-950' : 'bg-primary-800 text-white'}`}>
                          {!isOwn && <p className="text-xs font-semibold opacity-70 mb-0.5">{m.sender_name}</p>}
                          <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                          <span className="text-[10px] opacity-60 block mt-1">
                            {timeOf(m.created_at)}{m.edited_at ? ' · edited' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleReply} className="border-t border-primary-800 p-4 flex gap-3">
                <input
                  className="input-field flex-grow"
                  placeholder="Type a reply..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" disabled={sending} className="btn-primary px-4 disabled:opacity-60">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
