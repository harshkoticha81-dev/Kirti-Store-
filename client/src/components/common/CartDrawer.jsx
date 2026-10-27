import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { isBigAppliance } from '../../utils/shippingCalculator';

const CartDrawer = () => {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically close and never show CartDrawer on checkout or order-success pages
  useEffect(() => {
    if (location.pathname === '/checkout' || location.pathname.startsWith('/order-success')) {
      if (cartOpen) {
        setCartOpen(false);
      }
    }
  }, [location.pathname, cartOpen, setCartOpen]);

  if (location.pathname === '/checkout' || location.pathname.startsWith('/order-success')) {
    return null;
  }

  const hasBig = cart?.items?.some((i) => isBigAppliance(i.product));
  const freeShippingThreshold = 999;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - (cart?.subtotal || 0));
  const freeShippingPercent = Math.min(100, Math.round(((cart?.subtotal || 0) / freeShippingThreshold) * 100));

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-muted/50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-secondary" />
                  <h2 className="text-lg font-bold text-primary">Your Cart</h2>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-secondary/10 text-secondary rounded-full">
                    {cart.itemCount} items
                  </span>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-1.5 text-charcoal-light hover:text-charcoal rounded-full hover:bg-surface-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Appliance Transportation Indicator */}
              <div className="px-5 py-2.5 bg-slate-50 border-b border-surface-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Truck className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>Appliance Transportation:</span>
                </div>
                <span className="text-[11px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                  {hasBig ? '₹120 Big Package' : '₹60 Small Package'}
                </span>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 divide-y divide-surface-border">
                {cart.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mb-4">
                      <ShoppingBag className="w-10 h-10 text-charcoal-light" />
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-1">Your cart is empty</h3>
                    <p className="text-sm text-charcoal-light max-w-xs mb-6">
                      Looks like you haven't added any kitchen appliances yet.
                    </p>
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        navigate('/shop');
                      }}
                      className="px-6 py-2.5 bg-secondary text-white text-sm font-semibold rounded-full hover:bg-secondary-700 transition-colors shadow-sm"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.items.map((item) => (
                    <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                      <img
                        src={item.product?.image || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=200&q=80'}
                        alt={item.product?.name}
                        className="w-20 h-20 object-cover rounded-xl border border-surface-border flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-primary truncate">
                          {item.product?.name}
                        </h4>
                        <p className="text-xs text-charcoal-light mb-1">
                          SKU: {item.product?.SKU}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-secondary">
                            ₹{(item.product?.sellingPrice || 0).toLocaleString('en-IN')}
                          </span>
                          {item.product?.originalPrice && (
                            <span className="text-xs text-charcoal-light line-through">
                              ₹{item.product.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {/* Package size badge */}
                        <div className="mb-2">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isBigAppliance(item.product)
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-blue-50 text-blue-900 border border-blue-200'
                          }`}>
                            📦 {isBigAppliance(item.product) ? 'Big Package (₹120)' : 'Small Package (₹60)'}
                          </span>
                        </div>

                        {/* Quantity and Remove */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-surface-border rounded-lg bg-surface-muted overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="p-1.5 hover:bg-white text-charcoal transition-colors"
                              title="Decrease"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold text-primary">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="p-1.5 hover:bg-white text-charcoal transition-colors"
                              title="Increase"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-charcoal-light hover:text-rose-600 p-1.5 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Checkout Summary */}
              {cart.items.length > 0 && (
                <div className="p-5 border-t border-surface-border bg-white space-y-4">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-charcoal">
                      <span>Subtotal</span>
                      <span className="font-semibold">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-charcoal">
                      <span>Package Transportation</span>
                      <span className="font-semibold text-primary">
                        ₹{(cart.shippingFee || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-primary pt-2 border-t border-surface-border">
                      <span>Total Amount</span>
                      <span className="text-secondary text-lg">
                        ₹{cart.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 px-4 bg-primary hover:bg-zinc-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-black/15 transition-all transform active:scale-95"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-charcoal-light">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Secure Checkout • 100% Genuine Appliances</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
