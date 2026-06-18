import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../services/orders.service';
import { formatCurrency, formatDate } from '../utils/format.utils';
import { extractErrorMessage } from '../utils/error.utils';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_COLORS = {
  pending:   'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  confirmed: 'bg-blue-900/40 text-blue-300 border-blue-800',
  completed: 'bg-green-900/40 text-green-300 border-green-800',
  cancelled: 'bg-red-900/40 text-red-300 border-red-800',
};

const Orders = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    getOrders()
      .then((d) => setOrders(Array.isArray(d) ? d : d?.orders || []))
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      const updated = await updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, ...updated } : o)));
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-primary-400 text-sm mt-1">Manage customer orders</p>
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
      ) : orders.length === 0 ? (
        <p className="text-primary-400 text-sm">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-800 text-primary-400 text-left">
                <th className="pb-3 font-medium pr-4">Order</th>
                <th className="pb-3 font-medium pr-4">Customer</th>
                <th className="pb-3 font-medium pr-4">Date</th>
                <th className="pb-3 font-medium pr-4">Amount</th>
                <th className="pb-3 font-medium pr-4">Status</th>
                <th className="pb-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-800/50">
              {orders.map((order) => (
                <tr key={order._id} className="text-white">
                  <td className="py-4 pr-4 font-mono text-xs text-primary-400">{order._id?.slice(-8)}</td>
                  <td className="py-4 pr-4">
                    <p className="font-medium">{order.customer?.name || '—'}</p>
                    <p className="text-xs text-primary-500">{order.customer?.phone}</p>
                  </td>
                  <td className="py-4 pr-4 text-primary-300">{formatDate(order.created_at)}</td>
                  <td className="py-4 pr-4 text-accent font-semibold">{formatCurrency(order.total_amount || 0, order.currency)}</td>
                  <td className="py-4 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs border capitalize ${STATUS_COLORS[order.status] || 'bg-primary-800 text-primary-300 border-primary-700'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <select
                      value={order.status}
                      disabled={updating === order._id}
                      onChange={(e) => handleStatus(order._id, e.target.value)}
                      className="bg-primary-800 border border-primary-700 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                    >
                      {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
