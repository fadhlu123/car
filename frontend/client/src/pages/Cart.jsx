import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format.utils';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = cartItems[0]?.currency || 'GHS';

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 px-4">
        <ShoppingCart className="h-16 w-16 text-primary-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
        <p className="text-primary-400 mb-6">Browse our inventory and add a vehicle to get started.</p>
        <Link to="/listings" className="btn-primary">Browse Vehicles</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Your Cart</h1>
        <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-300 transition-colors">Clear all</button>
      </div>

      <div className="space-y-4 mb-8">
        {cartItems.map((item) => (
          <div key={item.productId} className="card p-4 flex items-center gap-4">
            <div className="w-24 h-18 rounded-lg overflow-hidden bg-primary-800 flex-shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary-600" />
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-white">{item.name}</h3>
              <p className="text-accent font-bold">{formatCurrency(item.price, item.currency)}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-400">
              Qty: {item.quantity}
            </div>
            <button onClick={() => removeFromCart(item.productId)} className="p-2 text-primary-500 hover:text-red-400 transition-colors">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-primary-400 text-sm">Total</p>
          <p className="text-3xl font-bold text-accent">{formatCurrency(total, currency)}</p>
        </div>
        <button onClick={() => navigate('/checkout')} className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center">
          Proceed to Checkout <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Cart;
