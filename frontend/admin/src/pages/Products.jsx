import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, X } from 'lucide-react';
import { getProducts, createProduct, updateProduct, addProductImages, deleteProduct } from '../services/inventory.service';
import { formatCurrency } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';

const EMPTY_FORM = {
  name: '', make: '', model: '', year: '', price: '', currency: 'GHS',
  condition: 'used', category: 'sedan', availability: 'available',
  mileage: '', colour: '', transmission: '', fuel_type: '',
  description: '', features: '',
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [images, setImages]     = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    getProducts()
      .then((d) => setProducts(Array.isArray(d) ? d : d?.products || []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setImages([]); setError(''); setShowModal(true); };
  const openEdit   = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name || '', make: p.make || '', model: p.model || '',
      year: p.year || '', price: p.price || '', currency: p.currency || 'GHS',
      condition: p.condition || 'used', category: p.category || 'sedan',
      availability: p.availability || 'available', mileage: p.mileage || '',
      colour: p.colour || '', transmission: p.transmission || '',
      fuel_type: p.fuel_type || '', description: p.description || '',
      features: (p.features || []).join(', '),
    });
    setImages([]);
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const featuresArray = form.features.split(',').map((s) => s.trim()).filter(Boolean);
      const payload = { ...form };
      delete payload.features;
      if (payload.year)    payload.year    = Number(payload.year);
      if (payload.price)   payload.price   = Number(payload.price);
      if (payload.mileage !== '') payload.mileage = Number(payload.mileage);
      const jsonPayload = { ...payload, features: featuresArray };

      if (editing) {
        const updated = await updateProduct(editing, jsonPayload);
        if (images.length > 0) await addProductImages(editing, images);
        setProducts((prev) => prev.map((p) => (p._id === editing ? { ...p, ...updated } : p)));
      } else {
        const fd = new FormData();
        Object.entries(jsonPayload).forEach(([k, v]) => {
          if (k === 'features') {
            v.forEach((f) => fd.append('features[]', f));
          } else if (v !== '' && v != null) {
            fd.append(k, v);
          }
        });
        images.forEach((img) => fd.append('images', img));
        const created = await createProduct(fd);
        setProducts((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-primary-400 text-sm mt-1">Manage your vehicle inventory</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-outline flex items-center gap-2 text-sm"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm"><Plus className="h-4 w-4" /> Add Vehicle</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-800 text-primary-400 text-left">
                  <th className="pb-3 font-medium pr-4">Vehicle</th>
                  <th className="pb-3 font-medium pr-4">Year</th>
                  <th className="pb-3 font-medium pr-4">Price</th>
                  <th className="pb-3 font-medium pr-4">Condition</th>
                  <th className="pb-3 font-medium pr-4">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-800/50">
                {products.map((p) => (
                  <tr key={p._id} className="text-white">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-primary-800 flex-shrink-0">
                          {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium">{p.make} {p.model}</p>
                          <p className="text-xs text-primary-500">{p.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-primary-300">{p.year}</td>
                    <td className="py-4 pr-4 text-accent font-semibold">{formatCurrency(p.price, p.currency)}</td>
                    <td className="py-4 pr-4 capitalize text-primary-300">{p.condition}</td>
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs border capitalize ${p.availability === 'available' ? 'bg-green-900/40 text-green-300 border-green-800' : 'bg-primary-800 text-primary-400 border-primary-700'}`}>
                        {p.availability}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-primary-400 hover:text-white hover:bg-primary-800 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 text-primary-400 hover:text-red-400 hover:bg-primary-800 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <p className="text-primary-400 text-sm text-center py-10">No products found.</p>}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative bg-primary-900 border border-primary-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-primary-800">
              <h2 className="text-lg font-bold text-white">{editing ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
              <button onClick={() => setShowModal(false)} className="text-primary-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-primary-400 mb-1">Make *</label><input name="make" required className="input-field" value={form.make} onChange={handleChange} /></div>
                <div><label className="block text-xs text-primary-400 mb-1">Model *</label><input name="model" required className="input-field" value={form.model} onChange={handleChange} /></div>
                <div><label className="block text-xs text-primary-400 mb-1">Year *</label><input name="year" type="number" required className="input-field" value={form.year} onChange={handleChange} /></div>
                <div><label className="block text-xs text-primary-400 mb-1">Price *</label><input name="price" type="number" required className="input-field" value={form.price} onChange={handleChange} /></div>
                <div>
                  <label className="block text-xs text-primary-400 mb-1">Currency</label>
                  <select name="currency" className="input-field" value={form.currency} onChange={handleChange}>
                    <option value="GHS">GHS</option><option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-primary-400 mb-1">Condition</label>
                  <select name="condition" className="input-field" value={form.condition} onChange={handleChange}>
                    <option value="new">New</option><option value="used">Used</option><option value="certified">Certified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-primary-400 mb-1">Category</label>
                  <select name="category" className="input-field" value={form.category} onChange={handleChange}>
                    {['sedan','suv','truck','van','coupe','convertible','hatchback'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-primary-400 mb-1">Availability</label>
                  <select name="availability" className="input-field" value={form.availability} onChange={handleChange}>
                    <option value="available">Available</option><option value="sold">Sold</option><option value="reserved">Reserved</option>
                  </select>
                </div>
                <div><label className="block text-xs text-primary-400 mb-1">Mileage (km)</label><input name="mileage" type="number" className="input-field" value={form.mileage} onChange={handleChange} /></div>
                <div><label className="block text-xs text-primary-400 mb-1">Colour</label><input name="colour" className="input-field" value={form.colour} onChange={handleChange} /></div>
                <div><label className="block text-xs text-primary-400 mb-1">Transmission</label><input name="transmission" className="input-field" placeholder="automatic / manual" value={form.transmission} onChange={handleChange} /></div>
                <div><label className="block text-xs text-primary-400 mb-1">Fuel Type</label><input name="fuel_type" className="input-field" placeholder="petrol / diesel / electric" value={form.fuel_type} onChange={handleChange} /></div>
              </div>

              <div><label className="block text-xs text-primary-400 mb-1">Display Name</label><input name="name" className="input-field" placeholder="e.g. 2020 Toyota Camry SE" value={form.name} onChange={handleChange} /></div>
              <div><label className="block text-xs text-primary-400 mb-1">Features (comma-separated)</label><input name="features" className="input-field" placeholder="Sunroof, Backup Camera, Leather Seats" value={form.features} onChange={handleChange} /></div>
              <div><label className="block text-xs text-primary-400 mb-1">Description</label><textarea name="description" rows={3} className="input-field resize-none" value={form.description} onChange={handleChange} /></div>

              <div>
                <label className="block text-xs text-primary-400 mb-1">Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setImages(Array.from(e.target.files))}
                  className="block w-full text-sm text-primary-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-800 file:text-white hover:file:bg-primary-700"
                />
                {images.length > 0 && <p className="text-xs text-primary-500 mt-1">{images.length} file(s) selected</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
