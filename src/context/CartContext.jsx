import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { cartService } from '../services/cartService';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Track if DB cart table exists to avoid repeated failing calls
  const [dbAvailable, setDbAvailable] = useState(true);

  // ── Coupon State ─────────────────────────────────────────────────────────
  const [appliedCoupon, setAppliedCouponState] = useState(null);

  // ── LocalStorage helpers ──────────────────────────────────────────────────
  const getLocalCart = () => {
    try {
      const local = localStorage.getItem('guest_cart');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  };

  const saveLocalCart = (items) => {
    localStorage.setItem('guest_cart', JSON.stringify(items));
    setCartItems(items);
  };

  // Check if an error means the DB table is missing
  const isSchemaError = (err) =>
    err?.message?.includes('schema cache') ||
    err?.message?.includes('does not exist') ||
    err?.code === 'PGRST204';

  // ── Fetch cart ────────────────────────────────────────────────────────────
  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user && dbAvailable) {
        const dbCart = await cartService.getCart(user.id);
        setCartItems(dbCart);
      } else {
        setCartItems(getLocalCart());
      }
    } catch (err) {
      if (isSchemaError(err)) {
        console.warn('Cart DB table not found — using localStorage fallback.');
        setDbAvailable(false);
        setCartItems(getLocalCart());
      } else {
        setError(err.message);
        console.error('Error fetching cart:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Sync local cart to DB on login ────────────────────────────────────────
  const syncCart = async (userId) => {
    const localItems = getLocalCart();

    if (!dbAvailable) {
      setCartItems(localItems);
      return;
    }

    try {
      setLoading(true);
      if (localItems.length > 0) {
        for (const item of localItems) {
          await cartService.addToCart(userId, item.product_id, item.quantity, item.size || '');
        }
        localStorage.removeItem('guest_cart');
      }
      const dbCart = await cartService.getCart(userId);
      setCartItems(dbCart);
    } catch (err) {
      if (isSchemaError(err)) {
        console.warn('Cart DB table not found — using localStorage fallback.');
        setDbAvailable(false);
        setCartItems(localItems);
      } else {
        console.error('Error syncing cart:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Trigger fetch/sync on user change ────────────────────────────────────
  useEffect(() => {
    if (user) {
      syncCart(user.id);
    } else {
      fetchCart();
    }
  }, [user]);

  // ── Add to Cart ───────────────────────────────────────────────────────────
  const addToCart = async (product, quantity = 1, size = '') => {
    setLoading(true);
    setError(null);
    try {
      if (user && dbAvailable) {
        await cartService.addToCart(user.id, product.id, quantity, size);
        await fetchCart();
      } else {
        const local = getLocalCart();
        const existingIndex = local.findIndex(item => item.product_id === product.id && (item.size || '') === size);
        if (existingIndex > -1) {
          local[existingIndex].quantity += quantity;
        } else {
          local.push({
            id: `local-${Date.now()}-${Math.random()}`,
            user_id: user?.id || null,
            product_id: product.id,
            quantity,
            product,
            size,
          });
        }
        saveLocalCart(local);
      }
    } catch (err) {
      if (isSchemaError(err)) {
        setDbAvailable(false);
        const local = getLocalCart();
        const existingIndex = local.findIndex(item => item.product_id === product.id && (item.size || '') === size);
        if (existingIndex > -1) {
          local[existingIndex].quantity += quantity;
        } else {
          local.push({
            id: `local-${Date.now()}-${Math.random()}`,
            user_id: user?.id || null,
            product_id: product.id,
            quantity,
            product,
            size,
          });
        }
        saveLocalCart(local);
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Update Quantity ───────────────────────────────────────────────────────
  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (user && dbAvailable) {
        await cartService.updateCartItemQuantity(itemId, quantity);
        await fetchCart();
      } else {
        const local = getLocalCart();
        const updated = local.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
        saveLocalCart(updated);
      }
    } catch (err) {
      if (isSchemaError(err)) {
        setDbAvailable(false);
        const local = getLocalCart();
        saveLocalCart(local.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        ));
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Remove Item ───────────────────────────────────────────────────────────
  const removeFromCart = async (itemId) => {
    setLoading(true);
    setError(null);
    try {
      if (user && dbAvailable) {
        await cartService.removeFromCart(itemId);
        await fetchCart();
      } else {
        const local = getLocalCart();
        saveLocalCart(local.filter(item => item.id !== itemId));
      }
    } catch (err) {
      if (isSchemaError(err)) {
        setDbAvailable(false);
        const local = getLocalCart();
        saveLocalCart(local.filter(item => item.id !== itemId));
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Clear Cart ────────────────────────────────────────────────────────────
  const clearCart = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user && dbAvailable) {
        await cartService.clearCart(user.id);
      } else {
        localStorage.removeItem('guest_cart');
      }
      setCartItems([]);
      setAppliedCouponState(null);
    } catch (err) {
      if (isSchemaError(err)) {
        setDbAvailable(false);
        localStorage.removeItem('guest_cart');
        setCartItems([]);
        setAppliedCouponState(null);
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Coupon Handlers ──────────────────────────────────────────────────────
  const setAppliedCoupon = (coupon) => {
    setAppliedCouponState(coupon);
  };

  const removeCoupon = () => {
    setAppliedCouponState(null);
  };

  // ── Computed values ───────────────────────────────────────────────────────
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cartItems.reduce((total, item) => {
    const product = item.product;
    if (!product) return total;
    const originalPrice = product.original_price ?? product.price ?? 0;
    const offerPrice = product.offer_price;
    const offer = product.offers || product.offer;
    const isOfferActive = !!(offerPrice && Number(offerPrice) > 0);
    const unitPrice = isOfferActive ? offerPrice : originalPrice;
    return total + unitPrice * item.quantity;
  }, 0);

  const discountAmount = React.useMemo(() => {
    if (!appliedCoupon) return 0;
    const couponValue = Number(appliedCoupon.value) || 0;
    let discount = 0;

    const restrictedProductIds = appliedCoupon.applicable_product_ids;
    let applicableSubtotal = cartTotal;

    if (Array.isArray(restrictedProductIds) && restrictedProductIds.length > 0) {
      applicableSubtotal = cartItems.reduce((sum, item) => {
        const product = item.product || item;
        const pId = item.product_id || item.product?.id || item.id;
        if (pId && restrictedProductIds.includes(pId)) {
          const originalPrice = product.original_price ?? product.price ?? 0;
          const offerPrice = product.offer_price;
          const isOfferActive = !!(offerPrice && Number(offerPrice) > 0);
          const unitPrice = isOfferActive ? Number(offerPrice) : Number(originalPrice);
          return sum + unitPrice * (item.quantity || 1);
        }
        return sum;
      }, 0);
    }

    if (appliedCoupon.type === 'percentage') {
      discount = (couponValue / 100) * applicableSubtotal;
    } else if (appliedCoupon.type === 'flat') {
      discount = Math.min(couponValue, applicableSubtotal);
    }

    return Math.max(0, Number(discount.toFixed(2)));
  }, [appliedCoupon, cartTotal, cartItems]);

  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const value = {
    cartItems,
    loading,
    error,
    dbAvailable,
    cartCount,
    cartTotal,
    appliedCoupon,
    discountAmount,
    finalTotal,
    setAppliedCoupon,
    removeCoupon,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
