import React, { createContext, useState, useEffect, useContext } from 'react';
import { getStoredCartItems, setStoredCartItems } from '../utils/storage.utils';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItemsState] = useState([]);

  useEffect(() => {
    // Load from local storage on mount
    const storedCart = getStoredCartItems();
    setCartItemsState(storedCart);
  }, []);

  // Wrap state setter to also sync with localStorage
  const setCartItems = (items) => {
    setCartItemsState(items);
    setStoredCartItems(items);
  };

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.productId === product._id);
      if (existing) {
        return prevItems.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { productId: product._id, name: product.name, price: product.price, currency: product.currency, quantity: 1, image: product.images?.[0]?.url }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
