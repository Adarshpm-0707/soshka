import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { wishlistService } from '../services/wishlistService';

export const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Track if DB wishlist table exists to avoid repeated failing calls
  const [dbAvailable, setDbAvailable] = useState(true);

  // ── LocalStorage helpers ──────────────────────────────────────────────────
  const getLocalWishlist = () => {
    try {
      const local = localStorage.getItem('guest_wishlist');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  };

  const saveLocalWishlist = (items) => {
    localStorage.setItem('guest_wishlist', JSON.stringify(items));
    setWishlistItems(items);
  };

  // ── Fetch wishlist ────────────────────────────────────────────────────────
  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user && dbAvailable) {
        const dbWishlist = await wishlistService.getWishlist(user.id);
        setWishlistItems(dbWishlist);
      } else {
        setWishlistItems(getLocalWishlist());
      }
    } catch (err) {
      // If the table doesn't exist, fall back to localStorage permanently
      if (err?.message?.includes('schema cache') || err?.code === 'PGRST204' || err?.message?.includes('does not exist')) {
        console.warn('Wishlist DB table not found — using localStorage fallback.');
        setDbAvailable(false);
        setWishlistItems(getLocalWishlist());
      } else {
        setError(err.message);
        console.error('Error fetching wishlist:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Sync guest wishlist on login ──────────────────────────────────────────
  const syncWishlist = async (userId) => {
    const localItems = getLocalWishlist();

    if (!dbAvailable) {
      // DB not available, just keep local items
      setWishlistItems(localItems);
      return;
    }

    try {
      setLoading(true);
      if (localItems.length > 0) {
        for (const item of localItems) {
          await wishlistService.addToWishlist(userId, item.product_id);
        }
        localStorage.removeItem('guest_wishlist');
      }
      const dbWishlist = await wishlistService.getWishlist(userId);
      setWishlistItems(dbWishlist);
    } catch (err) {
      if (err?.message?.includes('schema cache') || err?.message?.includes('does not exist')) {
        console.warn('Wishlist DB table not found — using localStorage fallback.');
        setDbAvailable(false);
        setWishlistItems(localItems);
      } else {
        console.error('Error syncing wishlist:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Trigger fetch/sync on user change ────────────────────────────────────
  useEffect(() => {
    if (user) {
      syncWishlist(user.id);
    } else {
      fetchWishlist();
    }
  }, [user]);

  // ── Add to Wishlist ───────────────────────────────────────────────────────
  const addToWishlist = async (product) => {
    setLoading(true);
    setError(null);
    try {
      if (user && dbAvailable) {
        await wishlistService.addToWishlist(user.id, product.id);
        await fetchWishlist();
      } else {
        // LocalStorage path (guest OR db unavailable)
        const local = getLocalWishlist();
        const exists = local.some(item => item.product_id === product.id);
        if (!exists) {
          local.push({
            id: `local-${Date.now()}-${Math.random()}`,
            user_id: user?.id || null,
            product_id: product.id,
            product,
          });
          saveLocalWishlist(local);
        }
      }
    } catch (err) {
      // DB table missing: fall back silently to localStorage
      if (err?.message?.includes('schema cache') || err?.message?.includes('does not exist')) {
        setDbAvailable(false);
        const local = getLocalWishlist();
        const exists = local.some(item => item.product_id === product.id);
        if (!exists) {
          local.push({
            id: `local-${Date.now()}-${Math.random()}`,
            user_id: user?.id || null,
            product_id: product.id,
            product,
          });
          saveLocalWishlist(local);
        }
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Remove from Wishlist ──────────────────────────────────────────────────
  const removeFromWishlist = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      if (user && dbAvailable) {
        await wishlistService.removeFromWishlist(user.id, productId);
        await fetchWishlist();
      } else {
        const local = getLocalWishlist();
        saveLocalWishlist(local.filter(item => item.product_id !== productId));
      }
    } catch (err) {
      if (err?.message?.includes('schema cache') || err?.message?.includes('does not exist')) {
        setDbAvailable(false);
        const local = getLocalWishlist();
        saveLocalWishlist(local.filter(item => item.product_id !== productId));
      } else {
        setError(err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Check helpers ─────────────────────────────────────────────────────────
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  const value = {
    wishlistItems,
    loading,
    error,
    dbAvailable,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
