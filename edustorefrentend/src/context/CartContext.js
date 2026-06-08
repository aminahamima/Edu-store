import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { ...product, qty }];
    });
  }, []);

  const removeFromCart = useCallback((id) => setCart((prev) => prev.filter((i) => i.id !== id)), []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const total = cart.reduce((s, i) => s + Number(i.prix || 0) * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  const value = useMemo(
    () => ({ cart, addToCart, removeFromCart, updateQty, clearCart, total, count }),
    [cart, addToCart, removeFromCart, updateQty, clearCart, total, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

