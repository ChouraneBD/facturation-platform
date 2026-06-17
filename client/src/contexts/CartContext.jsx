import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'facturation-cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (article) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === article.id);
      if (existing) {
        return prev.map(item => item.id === article.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...article, quantity: 1 }];
    });
  };

  const removeFromCart = (articleId) => {
    setCart((prev) => prev.filter(item => item.id !== articleId));
  };

  const updateQuantity = (articleId, quantity) => {
    setCart((prev) => prev.map(item => item.id === articleId ? { ...item, quantity: Math.max(1, quantity) } : item));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
