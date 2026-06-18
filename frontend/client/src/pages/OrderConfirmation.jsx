import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format.utils';

const OrderConfirmation = () => {
  const { state } = useLocation();
  const order = state?.order;

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-white mb-2">Order Placed!</h1>
      <p className="text-primary-400 mb-8">
        Thank you for your order. Our team will contact you shortly to confirm the details.
      </p>

      {order && (
        <div className="card p-6 text-left mb-8">
          <p className="text-xs text-primary-500 mb-1">Order reference</p>
          <p className="font-mono text-accent font-bold mb-4">{order._id || order.id}</p>
          {order.total_amount != null && (
            <div className="flex justify-between text-sm border-t border-primary-800 pt-4">
              <span className="text-primary-300">Total</span>
              <span className="text-white font-bold">{formatCurrency(order.total_amount, order.currency)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/listings" className="btn-outline">Browse More Vehicles</Link>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
