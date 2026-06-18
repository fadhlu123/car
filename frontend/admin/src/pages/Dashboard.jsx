import React, { useState, useEffect } from 'react';
import { ShoppingBag, Car, TrendingUp, Clock } from 'lucide-react';
import { getOrders } from '../services/orders.service';
import { getProducts } from '../services/inventory.service';
import { formatCurrency } from '../utils/format.utils';

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="card p-6 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-primary-800 flex items-center justify-center flex-shrink-0">
      <Icon className="h-6 w-6 text-accent" />
    </div>
    <div>
      <p className="text-sm text-primary-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-primary-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const STATUS_COLORS = {
  pending:   'bg-yellow-900/40 text-yellow-300 border-yellow-800',
  confirmed: 'bg-blue-900/40 text-blue-300 border-blue-800',
  completed: 'bg-green-900/40 text-green-300 border-green-800',
  cancelled: 'bg-red-900/40 text-red-300 border-red-800',
};

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOrders({ limit: 5 }).catch(() => []),
      getProducts({ limit: 100 }).catch(() => []),
    ]).then(([o, p]) => {
      setOrders(Array.isArray(o) ? o : o?.orders || []);
      setProducts(Array.isArray(p) ? p : p?.products || []);
    }).finally(() => setLoading(false));
  }, []);

  const revenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pending   = orders.filter((o) => o.status === 'pending').length;
  const available = products.filter((p) => p.availability === 'available').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-primary-400 text-sm mt-1">Overview of Auto Majid operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Completed Revenue" value={formatCurrency(revenue)} />
        <StatCard icon={ShoppingBag} label="Total Orders"     value={orders.length}   sub={`${pending} pending`} />
        <StatCard icon={Car}         label="Total Products"   value={products.length} sub={`${available} available`} />
        <StatCard icon={Clock}       label="Pending Orders"   value={pending} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-primary-400 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-800 text-primary-400 text-left">
                  <th className="pb-3 font-medium pr-6">Order</th>
                  <th className="pb-3 font-medium pr-6">Customer</th>
                  <th className="pb-3 font-medium pr-6">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-800/50">
                {orders.map((order) => (
                  <tr key={order._id} className="text-white">
                    <td className="py-3 pr-6 font-mono text-xs text-primary-400">{order._id?.slice(-8)}</td>
                    <td className="py-3 pr-6">{order.customer?.name || '—'}</td>
                    <td className="py-3 pr-6 text-accent font-semibold">{formatCurrency(order.total_amount || 0, order.currency)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs border capitalize ${STATUS_COLORS[order.status] || 'bg-primary-800 text-primary-300 border-primary-700'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
