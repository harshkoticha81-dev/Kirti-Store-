import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck, Truck, ChevronRight, PackageCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { isBigAppliance } from '../utils/shippingCalculator';
import { getSafeProductImageUrl, getApplianceFallbackImage } from '../utils/imageUtils';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    return localStorage.getItem('kirti_applied_coupon') || null;
  });
  const [couponDiscount, setCouponDiscount] = useState(() => {
    const saved = localStorage.getItem('kirti_coupon_discount');
    return saved ? parseInt(saved, 10) : 0;
  });

  const freeShippingThreshold = 999;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cart.subtotal);

  const calculateDiscountForCode = (code) => {
    if (code === 'KIRTI10' || code === 'WELCOME10') {
      return Math.round(cart.subtotal * 0.1);
    } else if (code === 'FESTIVE500') {
      return Math.min(500, cart.subtotal);
    }
    return 0;
  };

  const applySpecificCoupon = (code) => {
    const discount = calculateDiscountForCode(code);
    if (discount > 0) {
      setAppliedCoupon(code);
      setCouponDiscount(discount);
      localStorage.setItem('kirti_applied_coupon', code);
      localStorage.setItem('kirti_coupon_discount', discount.toString());
      showSuccess(`Coupon "${code}" applied! You saved ₹${discount.toLocaleString('en-IN')}.`);
    } else {
      showError('Unable to apply coupon to current cart amount.');
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'KIRTI10' || code === 'WELCOME10' || code === 'FESTIVE500') {
      applySpecificCoupon(code);
      setCouponInput('');
    } else {
      showError('Invalid coupon code. Try "KIRTI10" or "FESTIVE500"!');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput('');
    localStorage.removeItem('kirti_applied_coupon');
    localStorage.removeItem('kirti_coupon_discount');
  };

  const finalPayable = Math.max(0, cart.totalAmount - couponDiscount);

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 rounded-full bg-white border border-surface-border shadow-sm flex items-center justify-center mx-auto mb-6 text-charcoal-light">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-primary mb-2">Your Shopping Cart is Empty</h1>
        <p className="text-sm text-charcoal-light max-w-md mx-auto mb-8">
          Explore our premium kitchen collection and elevate your culinary experience with smart appliances.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-secondary hover:bg-secondary-700 text-white font-bold shadow-md transition-all"
        >
          <span>Discover Appliances</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-charcoal-light">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary">Shopping Cart ({cart.itemCount} items)</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Left Column: Cart Items List */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <h1 className="text-2xl font-black text-primary">Your Shopping Cart</h1>
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              Clear Cart
            </button>
          </div>

          {/* Items Table / Cards */}
          <div className="divide-y divide-surface-border bg-white rounded-3xl border border-surface-border p-6 shadow-sm">
            {cart.items.map((item) => (
              <div key={item._id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-6 items-center">
                <img
                  src={getSafeProductImageUrl(item.product?.image, item.product?.categoryName || item.product?.name)}
                  alt={item.product?.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-surface-border flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getApplianceFallbackImage(item.product?.categoryName || item.product?.name);
                  }}
                />

                <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                    {item.product?.categoryName}
                  </span>
                  <h3 className="font-bold text-base text-primary truncate">
                    {item.product?.name}
                  </h3>
                  <p className="text-xs text-charcoal-light">
                    SKU: {item.product?.SKU}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="font-black text-primary text-base">
                      ₹{(item.product?.sellingPrice || 0).toLocaleString('en-IN')}
                    </span>
                    {item.product?.originalPrice && (
                      <span className="text-xs text-charcoal-light line-through">
                        ₹{item.product.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Appliance Package Size Badge */}
                  <div className="pt-1.5 flex justify-center sm:justify-start">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      isBigAppliance(item.product)
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-blue-50 text-blue-900 border border-blue-200'
                    }`}>
                      <span>📦</span>
                      <span>
                        {isBigAppliance(item.product)
                          ? 'Big Appliance Package: ₹120 Transport'
                          : 'Small Appliance Package: ₹60 Transport'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Quantity and Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="flex items-center border border-surface-border rounded-xl bg-surface-muted overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="p-2 hover:bg-white text-charcoal transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-xs font-bold text-primary">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="p-2 hover:bg-white text-charcoal transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="font-black text-base text-secondary min-w-[80px] text-right">
                    ₹{(item.lineTotal || 0).toLocaleString('en-IN')}
                  </span>

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="p-2 text-charcoal-light hover:text-rose-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-between items-center">
            <Link
              to="/shop"
              className="text-xs font-bold text-secondary hover:text-secondary-700 flex items-center gap-1.5"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary Box */}
        <div className="lg:w-96 space-y-6">
          <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-primary pb-3 border-b border-surface-border">
              Order Summary
            </h2>

            {/* Appliance Transportation Notice */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Truck className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span>Package Transportation Charge</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">
                  {cart.items.some(i => isBigAppliance(i.product)) ? 'Big Package Rate' : 'Small Package Rate'}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-light leading-relaxed">
                Big size appliance: <strong>₹120</strong> (₹100–₹150 range) • Small size appliance: <strong>₹60</strong> (₹50–₹120 range). Impact-cushioned transit packaging.
              </p>
            </div>

            {/* Promo Code / Coupon Section */}
            <div className="pt-2 border-t border-surface-border space-y-3">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                Apply Promo Code
              </label>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-800">Coupon "{appliedCoupon}" Applied</span>
                    <p className="text-[11px] text-emerald-700">You saved ₹{couponDiscount.toLocaleString('en-IN')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code: KIRTI10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-surface-border text-charcoal uppercase tracking-wider focus:ring-1 focus:ring-secondary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Quick Coupon Chips */}
              {!appliedCoupon && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => applySpecificCoupon('KIRTI10')}
                    className="text-[10px] px-2 py-0.5 rounded-lg border border-dashed border-secondary bg-blue-50/50 text-secondary font-bold hover:bg-blue-100 transition-colors"
                  >
                    KIRTI10 (10% OFF)
                  </button>
                  <button
                    type="button"
                    onClick={() => applySpecificCoupon('FESTIVE500')}
                    className="text-[10px] px-2 py-0.5 rounded-lg border border-dashed border-emerald-600 bg-emerald-50/50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors"
                  >
                    FESTIVE500 (₹500 OFF)
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-charcoal">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span className="font-semibold">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-charcoal">
                <div>
                  <span className="block">Package Transportation</span>
                  <span className="text-[11px] text-charcoal-light">
                    {cart.items.some(i => isBigAppliance(i.product))
                      ? 'Big appliance package rate'
                      : 'Small appliance package rate'}
                  </span>
                </div>
                <span className="font-bold text-primary">
                  ₹{(cart.shippingFee || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-charcoal">
                <span>GST / Taxes (5%)</span>
                <span className="font-semibold text-charcoal-light">Included in MRP</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="pt-3 border-t border-surface-border flex justify-between items-baseline">
                <span className="text-base font-bold text-primary">Final Payable</span>
                <div className="text-right">
                  {couponDiscount > 0 && (
                    <span className="block text-xs text-charcoal-light line-through font-normal">
                      ₹{cart.totalAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-2xl font-black text-primary">
                    ₹{finalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 rounded-xl bg-primary hover:bg-zinc-800 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-black/15 transition-all transform active:scale-95"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Cart;
