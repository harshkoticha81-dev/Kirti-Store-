import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { calculateCartTransportation } from '../utils/shippingCalculator';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('kirti_cart');
    return saved
      ? JSON.parse(saved)
      : { items: [], subtotal: 0, shippingFee: 0, totalAmount: 0, itemCount: 0 };
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Recalculate local cart metrics using dynamic appliance transportation rules
  const computeCartTotals = (items) => {
    let subtotal = 0;
    let itemCount = 0;

    items.forEach((item) => {
      const price = item.product?.sellingPrice || item.price || 0;
      subtotal += price * item.quantity;
      itemCount += item.quantity;
    });

    // Dynamic transportation charge according to appliance package size:
    // Big size appliance: standard ₹120 (within ₹100-₹150 range)
    // Small size appliance: standard ₹60 (within ₹50-₹120 range)
    const transportResult = calculateCartTransportation(items);
    const shippingFee = subtotal === 0 ? 0 : transportResult.fee;
    const totalAmount = subtotal + shippingFee;

    return {
      items,
      subtotal,
      shippingFee,
      totalAmount,
      itemCount,
      transportationDetails: transportResult
    };
  };

  // Fetch server cart if authenticated
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        setCart(res.data.cart);
        localStorage.setItem('kirti_cart', JSON.stringify(res.data.cart));
      }
    } catch (err) {
      console.error('[Cart Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  // Save guest cart to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('kirti_cart', JSON.stringify(cart));
    }
  }, [cart, isAuthenticated]);

  const addToCart = async (product, quantity = 1) => {
    const qty = Math.max(1, parseInt(quantity, 10));

    // Validate stock
    if (product.stockQuantity <= 0) {
      showError(`Sorry, "${product.name}" is currently out of stock.`);
      return false;
    }

    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await api.post('/cart/items', {
          productId: product._id,
          quantity: qty,
        });
        if (res.data.success) {
          setCart(res.data.cart);
          setCartOpen(true);
          success(`Added ${product.name} to cart!`);
          return true;
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to add item to cart.';
        showError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    } else {
      // Guest local cart
      setCart((prev) => {
        const existingIdx = prev.items.findIndex(
          (i) => (i.product?._id || i.product) === product._id
        );
        let updatedItems = [...prev.items];

        if (existingIdx > -1) {
          const currentQty = updatedItems[existingIdx].quantity;
          const newQty = currentQty + qty;
          if (newQty > product.stockQuantity) {
            showError(`Maximum available stock is ${product.stockQuantity}.`);
            return prev;
          }
          updatedItems[existingIdx].quantity = newQty;
          updatedItems[existingIdx].lineTotal = product.sellingPrice * newQty;
        } else {
          updatedItems.push({
            _id: `guest_${Date.now()}`,
            product: {
              _id: product._id,
              name: product.name,
              slug: product.slug,
              SKU: product.SKU,
              sellingPrice: product.sellingPrice,
              originalPrice: product.originalPrice,
              stockQuantity: product.stockQuantity,
              image: product.images?.[0] || '',
              categoryName: product.categoryName,
            },
            quantity: qty,
            lineTotal: product.sellingPrice * qty,
            inStock: true,
            maxAvailable: product.stockQuantity,
          });
        }

        const newCart = computeCartTotals(updatedItems);
        setCartOpen(true);
        success(`Added ${product.name} to cart!`);
        return newCart;
      });
      return true;
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);

    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await api.patch(`/cart/items/${itemId}`, { quantity: qty });
        if (res.data.success) {
          setCart(res.data.cart);
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Could not update quantity.');
      } finally {
        setLoading(false);
      }
    } else {
      setCart((prev) => {
        let updated = [...prev.items];
        if (qty <= 0) {
          updated = updated.filter((i) => i._id !== itemId);
        } else {
          updated = updated.map((i) => {
            if (i._id === itemId) {
              if (qty > i.maxAvailable) {
                showError(`Only ${i.maxAvailable} units available.`);
                return i;
              }
              return {
                ...i,
                quantity: qty,
                lineTotal: (i.product?.sellingPrice || 0) * qty,
              };
            }
            return i;
          });
        }
        return computeCartTotals(updated);
      });
    }
  };

  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await api.delete(`/cart/items/${itemId}`);
        if (res.data.success) {
          setCart(res.data.cart);
          success('Item removed from cart.');
        }
      } catch (err) {
        showError('Failed to remove item.');
      } finally {
        setLoading(false);
      }
    } else {
      setCart((prev) => {
        const filtered = prev.items.filter((i) => i._id !== itemId);
        success('Item removed from cart.');
        return computeCartTotals(filtered);
      });
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete('/cart');
      } catch (err) {
        console.error(err);
      }
    }
    const empty = { items: [], subtotal: 0, shippingFee: 0, totalAmount: 0, itemCount: 0 };
    setCart(empty);
    localStorage.removeItem('kirti_cart');
  };

  const syncLocalCartToServer = async () => {
    try {
      const saved = localStorage.getItem('kirti_cart');
      const localCart = saved ? JSON.parse(saved) : null;
      if (localCart && localCart.items && localCart.items.length > 0) {
        for (const item of localCart.items) {
          const productId = item.product?._id || item.product;
          if (productId) {
            try {
              await api.post('/cart/items', {
                productId,
                quantity: item.quantity || 1,
              });
            } catch (e) {
              // Ignore individual item duplicate issues
            }
          }
        }
        await fetchCart();
      }
    } catch (err) {
      console.error('[Cart Sync Error]:', err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartOpen,
        setCartOpen,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        syncLocalCartToServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
