import React, { useState, useEffect, useRef } from 'react';
import { Phone, Mail, MapPin, Send, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSSE } from '../hooks/useSSE';
import { getContactInfo } from '../services/content.service';
import { getConversation, sendMessage, editMessage } from '../services/contact.service';
import { extractErrorMessage } from '../utils/error.utils';

const timeOf = (dateString) =>
  new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const Contact = () => {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    getContactInfo().then(setInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getConversation()
      .then((c) => setMessages(c.messages || []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useSSE({
    chat_message: (payload) => {
      if (!payload?.message) return;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === payload.message.id);
        if (idx === -1) return [...prev, payload.message];
        const next = [...prev];
        next[idx] = payload.message;
        return next;
      });
    },
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError('');
    try {
      const message = await sendMessage(draft.trim());
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditDraft(msg.body);
  };

  const saveEdit = async (id) => {
    if (!editDraft.trim()) return;
    try {
      const updated = await editMessage(id, editDraft.trim());
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setEditingId(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
      <p className="text-primary-400 mb-8">Reach out directly, or chat with our team below.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="card p-5 flex items-center gap-3">
          <Phone className="h-5 w-5 text-accent shrink-0" />
          <span className="text-sm text-primary-200">{info?.phone || 'Not provided yet'}</span>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <Mail className="h-5 w-5 text-accent shrink-0" />
          <span className="text-sm text-primary-200">{info?.email || 'Not provided yet'}</span>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <MapPin className="h-5 w-5 text-accent shrink-0" />
          <span className="text-sm text-primary-200">{info?.address || 'Not provided yet'}</span>
        </div>
      </div>

      {!user ? (
        <div className="card p-10 text-center">
          <p className="text-primary-300 mb-4">Sign in to chat directly with our team.</p>
          <a href="/login" className="btn-primary inline-block">Sign In</a>
        </div>
      ) : (
        <div className="card flex flex-col h-[32rem]">
          <div className="px-6 py-4 border-b border-primary-800">
            <h2 className="text-lg font-semibold text-white">Chat with Support</h2>
          </div>

          <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-primary-500 text-sm py-10">No messages yet — say hello!</p>
            ) : (
              messages.map((m) => {
                const isOwn = m.sender_type === 'user';
                const isEditing = editingId === m.id;
                return (
                  <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isOwn ? 'bg-accent text-primary-950' : 'bg-primary-800 text-white'}`}>
                      {!isOwn && <p className="text-xs font-semibold opacity-70 mb-0.5">{m.sender_name}</p>}
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            className="bg-primary-950/20 rounded-lg px-2 py-1 text-sm outline-none flex-grow"
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(m.id)}
                          />
                          <button onClick={() => saveEdit(m.id)}><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingId(null)}><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] opacity-60">
                          {timeOf(m.created_at)}{m.edited_at ? ' · edited' : ''}
                        </span>
                        {isOwn && m.editable && !isEditing && (
                          <button onClick={() => startEdit(m)} className="opacity-60 hover:opacity-100">
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {error && <p className="px-6 py-2 text-xs text-red-400">{error}</p>}

          <form onSubmit={handleSend} className="border-t border-primary-800 p-4 flex gap-3">
            <input
              className="input-field flex-grow"
              placeholder="Type a message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" disabled={sending} className="btn-primary px-4 disabled:opacity-60">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Contact;
