import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { submitOrder } from '../services/orders.service';
import { formatCurrency } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name:  user ? `${user.first_name} ${user.last_name}`.trim() : '',
    email: user?.email || '',
    phone: '',
    notes: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const total    = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = cartItems[0]?.currency || 'GHS';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setError('');
    setLoading(true);
    try {
      const payload = {
        items: cartItems.map((item) => ({
          product_id: item.productId,
          name:       item.name,
          price:      item.price,
          currency:   item.currency || 'GHS',
          quantity:   item.quantity,
        })),
        customer: {
          name:  form.name,
          email: form.email,
          phone: form.phone,
          ...(form.notes ? { notes: form.notes } : {}),
        },
      };
      const order = await submitOrder(payload);
      clearCart();
      navigate('/order-confirmation', { state: { order } });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your Details</h2>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-1">Full Name</label>
                <input name="name" type="text" required className="input-field" value={form.name} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-1">Email</label>
                <input name="email" type="email" required className="input-field" value={form.email} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-1">Phone Number</label>
                <input name="phone" type="tel" required className="input-field" placeholder="+233 XX XXX XXXX" value={form.phone} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-1">Notes <span className="text-primary-500 text-xs">(optional)</span></label>
                <textarea name="notes" rows={3} className="input-field resize-none" placeholder="Any special requests..." value={form.notes} onChange={handleChange} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? 'Placing order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-primary-300 truncate mr-2">{item.name} ×{item.quantity}</span>
                  <span className="text-white font-medium flex-shrink-0">{formatCurrency(item.price * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-primary-800 pt-4 flex justify-between">
              <span className="font-semibold text-white">Total</span>
              <span className="font-bold text-accent text-lg">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
