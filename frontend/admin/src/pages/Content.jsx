import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Image as ImageIcon, Video, Type, Phone, Mail, MapPin } from 'lucide-react';
import {
  listBlocks, addBlock, deleteBlock, reorderBlocks,
  getContactInfo, updateContactInfo,
} from '../services/content.service';
import { extractErrorMessage } from '../utils/error.utils';

const BLOCK_ICONS = { paragraph: Type, image: ImageIcon, video: Video };

const Content = () => {
  const [tab, setTab] = useState('about');

  // About Us
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newType, setNewType] = useState('paragraph');
  const [newText, setNewText] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newFloat, setNewFloat] = useState('none');
  const [newFile, setNewFile] = useState(null);
  const [adding, setAdding] = useState(false);

  // Contact Info
  const [contact, setContact] = useState({ phone: '', email: '', address: '' });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');

  const loadBlocks = () => {
    setLoading(true);
    listBlocks()
      .then((b) => setBlocks(b.sort((a, b2) => a.order - b2.order)))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(loadBlocks, []);
  useEffect(() => {
    getContactInfo().then(setContact).catch(() => {});
  }, []);

  const handleAddBlock = async (e) => {
    e.preventDefault();
    setError('');
    if (newType === 'paragraph' && !newText.trim()) return;
    if ((newType === 'image' || newType === 'video') && !newFile) return;

    setAdding(true);
    try {
      const data = newType === 'paragraph'
        ? { type: newType, text: newText.trim() }
        : { type: newType, caption: newCaption.trim(), float: newType === 'image' ? newFloat : undefined };
      const block = await addBlock(data, newFile);
      setBlocks((prev) => [...prev, block]);
      setNewText(''); setNewCaption(''); setNewFile(null); setNewFloat('none');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this block?')) return;
    try {
      await deleteBlock(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
    try {
      await reorderBlocks(next.map((b, i) => ({ id: b.id, order: i })));
    } catch (err) {
      alert(extractErrorMessage(err));
      loadBlocks();
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSaving(true);
    setContactSuccess('');
    try {
      await updateContactInfo(contact);
      setContactSuccess('Contact info updated.');
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setContactSaving(false);
    }
  };

  const TABS = [
    { id: 'about',   label: 'About Us' },
    { id: 'contact', label: 'Contact Info' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Site Content</h1>
        <p className="text-primary-400 text-sm mt-1">Manage the About Us page and public contact info</p>
      </div>

      <div className="flex gap-2 border-b border-primary-800">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === id ? 'border-accent text-accent' : 'border-transparent text-primary-400 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'about' && (
        <div className="space-y-6">
          {error && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}

          <form onSubmit={handleAddBlock} className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" /> Add Block
            </h2>
            <div className="flex gap-3">
              {['paragraph', 'image', 'video'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={`px-4 py-2 rounded-xl text-sm capitalize border ${newType === t ? 'bg-accent text-primary-950 border-accent' : 'border-primary-700 text-primary-300 hover:bg-primary-800'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {newType === 'paragraph' ? (
              <textarea
                className="input-field min-h-[100px]"
                placeholder="Write a paragraph..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  accept={newType === 'image' ? 'image/*' : 'video/mp4,video/webm'}
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-primary-300"
                />
                <input
                  className="input-field"
                  placeholder="Caption (optional)"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                />
                {newType === 'image' && (
                  <select className="input-field" value={newFloat} onChange={(e) => setNewFloat(e.target.value)}>
                    <option value="none">Full width</option>
                    <option value="left">Wrap text — image on left</option>
                    <option value="right">Wrap text — image on right</option>
                  </select>
                )}
              </div>
            )}

            <button type="submit" disabled={adding} className="btn-primary disabled:opacity-60">
              {adding ? 'Adding...' : 'Add Block'}
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
            </div>
          ) : blocks.length === 0 ? (
            <div className="card p-8 text-center text-primary-400">No blocks yet — add the first one above.</div>
          ) : (
            <div className="space-y-3">
              {blocks.map((b, i) => {
                const Icon = BLOCK_ICONS[b.type];
                return (
                  <div key={b.id} className="card p-4 flex items-center gap-4">
                    <Icon className="h-5 w-5 text-accent shrink-0" />
                    <div className="min-w-0 flex-grow">
                      {b.type === 'paragraph' ? (
                        <p className="text-sm text-primary-200 truncate">{b.text}</p>
                      ) : (
                        <p className="text-sm text-primary-200 truncate">
                          {b.caption || `${b.type} block`} {b.float && b.float !== 'none' ? `· float ${b.float}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 text-primary-400 hover:text-white disabled:opacity-30">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="p-1.5 text-primary-400 hover:text-white disabled:opacity-30">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-1.5 text-primary-400 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'contact' && (
        <form onSubmit={handleContactSubmit} className="card p-6 space-y-4 max-w-lg">
          {contactSuccess && <div className="bg-green-900/30 border border-green-800 text-green-300 text-sm rounded-lg px-4 py-3">{contactSuccess}</div>}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1 flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</label>
            <input className="input-field" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1 flex items-center gap-2"><Mail className="h-4 w-4" /> Email</label>
            <input className="input-field" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-1 flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</label>
            <input className="input-field" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
          </div>
          <button type="submit" disabled={contactSaving} className="btn-primary disabled:opacity-60">
            {contactSaving ? 'Saving...' : 'Save Contact Info'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Content;
