import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, X, EyeOff, Eye } from 'lucide-react';
import { getBroadcasts, createBroadcast, updateBroadcast, deleteBroadcast } from '../services/notifications.service';
import { formatDate } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  title: '', body: '', cta_url: '', cta_label: '', audience: 'all_users',
};

const Broadcasts = () => {
  const { admin } = useAuth();
  const isOwner = admin?.admin_role === 'owner';

  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [imageFile, setImageFile]   = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getBroadcasts()
      .then((d) => setBroadcasts(d?.broadcasts || []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setCurrentImageUrl('');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditing(b.id);
    setForm({
      title: b.title || '', body: b.body || '',
      cta_url: b.cta_url || '', cta_label: b.cta_label || '', audience: b.audience || 'all_users',
    });
    setImageFile(null);
    setCurrentImageUrl(b.image_url || '');
    setFormError('');
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '') payload.append(key, value);
      });
      if (imageFile) payload.append('image', imageFile);

      if (editing) {
        const updated = await updateBroadcast(editing, payload);
        setBroadcasts((prev) => prev.map((b) => (b.id === editing ? { ...b, ...updated } : b)));
      } else {
        const created = await createBroadcast(payload);
        setBroadcasts((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (b) => {
    try {
      const updated = await updateBroadcast(b.id, { is_active: !b.is_active });
      setBroadcasts((prev) => prev.map((x) => (x.id === b.id ? { ...x, ...updated } : x)));
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this broadcast permanently?')) return;
    try {
      await deleteBroadcast(id);
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Broadcasts</h1>
          <p className="text-primary-400 text-sm mt-1">Send announcements to all customers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-outline flex items-center gap-2 text-sm"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm"><Plus className="h-4 w-4" /> New Broadcast</button>
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" /></div>
      ) : broadcasts.length === 0 ? (
        <div className="card p-12 text-center text-primary-400">
          <p>No broadcasts yet. Publish your first announcement.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-800 text-primary-400 text-left">
                <th className="px-6 py-4 font-medium">Announcement</th>
                <th className="px-6 py-4 font-medium">Audience</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Published</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-800/50">
              {broadcasts.map((b) => (
                <tr key={b.id} className="text-white">
                  <td className="px-6 py-4 max-w-xs">
                    <p className="font-medium truncate">{b.title}</p>
                    <p className="text-xs text-primary-500 truncate">{b.body}</p>
                  </td>
                  <td className="px-6 py-4 text-primary-300 text-xs capitalize">{b.audience.replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs border ${b.is_active ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-primary-800 text-primary-400 border-primary-700'}`}>
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-primary-400 text-xs">{formatDate(b.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="p-1.5 text-primary-400 hover:text-white hover:bg-primary-800 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleToggleActive(b)} className="p-1.5 text-primary-400 hover:text-white hover:bg-primary-800 rounded-lg transition-colors">
                        {b.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {isOwner && (
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 text-primary-400 hover:text-red-400 hover:bg-primary-800 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative bg-primary-900 border border-primary-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">{editing ? 'Edit Broadcast' : 'New Broadcast'}</h2>
              <button onClick={() => setShowModal(false)} className="text-primary-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{formError}</div>}

              <div>
                <label className="block text-xs text-primary-400 mb-1">Title *</label>
                <input name="title" required maxLength={200} className="input-field" value={form.title} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-xs text-primary-400 mb-1">Message *</label>
                <textarea name="body" rows={3} required maxLength={1000} className="input-field resize-none" value={form.body} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-xs text-primary-400 mb-1">Audience</label>
                <select name="audience" className="input-field" value={form.audience} onChange={handleChange}>
                  <option value="all_users">All users</option>
                  <option value="verified_only">Verified users only</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-primary-400 mb-1">Broadcast Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-primary-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-800 file:text-white hover:file:bg-primary-700"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {(imageFile || currentImageUrl) && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-primary-800 bg-primary-800/40">
                      {imageFile ? (
                        <img src={previewUrl} alt="Broadcast preview" className="h-32 w-full object-cover" />
                      ) : (
                        <img src={currentImageUrl} alt="Current broadcast" className="h-32 w-full object-cover" />
                      )}
                    </div>
                  )}
                </div>
                <div><label className="block text-xs text-primary-400 mb-1">Link URL</label><input name="cta_url" type="url" className="input-field" value={form.cta_url} onChange={handleChange} /></div>
              </div>
              <div>
                <label className="block text-xs text-primary-400 mb-1">Link Label</label>
                <input name="cta_label" maxLength={50} className="input-field" placeholder="e.g. View Offer" value={form.cta_label} onChange={handleChange} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Broadcasts;
