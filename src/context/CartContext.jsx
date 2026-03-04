import { createContext, useState, useEffect, useCallback } from 'react';
import {
  getCart,
  addToCart as addToCartApi,
  updateCartItem,
  removeFromCart as removeFromCartApi,
} from '../services/cartService';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    try {
      const items = await getCart();
      setCartItems(items);
    } catch {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product, quantity = 1) => {
    const items = await addToCartApi(product.id, quantity);
    setCartItems(items);
  };

  const removeFromCart = async (productId) => {
    const items = await removeFromCartApi(productId);
    setCartItems(items);
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    const items = await updateCartItem(productId, quantity);
    setCartItems(items);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartCount,
    loading,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export { CartContext };
