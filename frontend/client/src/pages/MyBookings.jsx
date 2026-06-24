import React, { useState, useEffect } from 'react';
import { RefreshCw, Package } from 'lucide-react';
import { getMyOrders } from '../services/orders.service';
import { formatCurrency, formatDate } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';

const STATUS_COLORS = {
  pending:   'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  contacted: 'bg-blue-900/40 text-blue-300 border-blue-800',
  completed: 'bg-green-900/40 text-green-300 border-green-800',
  cancelled: 'bg-red-900/40 text-red-300 border-red-800',
};

const STATUS_LABELS = {
  pending:   'Pending review',
  contacted: 'We have contacted you',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const MyBookings = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getMyOrders()
      .then((d) => setOrders(d?.orders || []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">My Bookings</h1>
        <button onClick={load} className="btn-outline flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="h-10 w-10 text-primary-600 mx-auto mb-3" />
          <p className="text-primary-300">You haven't booked a vehicle yet.</p>
          <p className="text-primary-500 text-sm mt-1">Orders you place will show up here, along with their status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-primary-500 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-white font-medium mt-1">{order.item_count} item{order.item_count > 1 ? 's' : ''}</p>
                  <p className="text-primary-500 text-xs mt-1">Placed {formatDate(order.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-accent font-semibold">{formatCurrency(order.total_amount, order.currency)}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs border capitalize ${STATUS_COLORS[order.status] || 'bg-primary-800 text-primary-300 border-primary-700'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
