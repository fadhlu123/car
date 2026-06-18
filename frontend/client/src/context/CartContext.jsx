import React, { createContext, useState, useEffect, useContext } from 'react';
import { getStoredCartItems, setStoredCartItems } from '../utils/storage.utils';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItemsState] = useState([]);

  useEffect(() => {
    setCartItemsState(getStoredCartItems());
  }, []);

  const setCartItems = (items) => {
    setCartItemsState(items);
    setStoredCartItems(items);
  };

  const addToCart = (product) => {
    // API returns `id`, not `_id`
    const productId = product.id || product._id;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId,
          name:     product.name,
          price:    product.price,
          currency: product.currency || 'GHS',
          quantity: 1,
          image:    product.images?.[0]?.url || product.thumbnail || null,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
