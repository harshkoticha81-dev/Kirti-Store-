import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();

  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('kirti_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/wishlist');
      if (res.data.success) {
        setWishlist(res.data.wishlist || []);
        localStorage.setItem('kirti_wishlist', JSON.stringify(res.data.wishlist || []));
      }
    } catch (err) {
      console.error('[Wishlist Error]:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  const toggleWishlist = async (product) => {
    const productId = product._id;
    const exists = wishlist.some((item) => (item._id || item) === productId);

    if (isAuthenticated) {
      try {
        if (exists) {
          const res = await api.delete(`/wishlist/${productId}`);
          if (res.data.success) {
            setWishlist(res.data.wishlist);
            success(`Removed "${product.name}" from wishlist.`);
          }
        } else {
          const res = await api.post(`/wishlist/${productId}`);
          if (res.data.success) {
            setWishlist(res.data.wishlist);
            success(`Added "${product.name}" to wishlist.`);
          }
        }
      } catch (err) {
        showError('Could not update wishlist.');
      }
    } else {
      // Local toggle for guest
      setWishlist((prev) => {
        let updated;
        if (exists) {
          updated = prev.filter((item) => (item._id || item) !== productId);
          success(`Removed "${product.name}" from wishlist.`);
        } else {
          updated = [...prev, product];
          success(`Added "${product.name}" to wishlist.`);
        }
        localStorage.setItem('kirti_wishlist', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => (item._id || item) === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
