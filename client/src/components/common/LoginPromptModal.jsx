import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, X, Lock, ShoppingBag, ShieldCheck, Smartphone } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { getSafeProductImageUrl, getApplianceFallbackImage } from '../../utils/imageUtils';

const LoginPromptModal = ({ isOpen, onClose, product, onOpenOtp }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin } = useAuth();

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRedirect = encodeURIComponent(location.pathname + location.search);

  const handleGoLogin = () => {
    onClose();
    navigate(`/login?redirect=${currentRedirect}`);
  };

  const handleGoRegister = () => {
    onClose();
    navigate(`/register?redirect=${currentRedirect}`);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    const res = await googleLogin(credentialResponse.credential);
    if (res?.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-surface-border overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-200 p-6 sm:p-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-charcoal-light hover:text-primary rounded-full hover:bg-surface-muted transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-secondary">
              Customer Account Required
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-primary mt-1">
              Please Log In to Add to Cart
            </h3>
            <p className="text-xs text-charcoal-light mt-1.5 leading-relaxed">
              Sign in to your Kirti Store account to add appliances to your cart, save delivery addresses, and proceed to checkout.
            </p>
          </div>
        </div>

        {/* Product Preview Card (if product was clicked) */}
        {product && (
          <div className="my-5 p-3.5 rounded-2xl bg-surface-muted/50 border border-surface-border flex items-center gap-3.5">
            <img
              src={getSafeProductImageUrl(product.images?.[0], product.categoryName || product.name)}
              alt={product.name}
              className="w-14 h-14 rounded-xl object-cover bg-white border border-surface-border flex-shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getApplianceFallbackImage(product.categoryName || product.name);
              }}
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                {product.categoryName || 'Kitchen Appliance'}
              </span>
              <p className="text-xs font-bold text-primary truncate mt-0.5">
                {product.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-black text-primary">
                  ₹{product.sellingPrice?.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && product.originalPrice > product.sellingPrice && (
                  <span className="text-[10px] text-charcoal-light line-through font-medium">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-charcoal-light py-2 border-y border-surface-border/60 my-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Secure Shopping
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-secondary" />
            Fast Order Tracking
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Quick Google Sign In */}
          <div className="flex justify-center w-full pb-1">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.warn('[Google Sign-In]: Modal login closed or failed')}
              shape="pill"
              size="large"
              text="signin_with"
              theme="outline"
              width="100%"
            />
          </div>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-surface-border w-full"></div>
            <span className="bg-white px-2 text-[10px] font-semibold text-charcoal-light uppercase tracking-wider">
              or
            </span>
            <div className="border-t border-surface-border w-full"></div>
          </div>

          {/* Instant Mobile OTP Option */}
          {onOpenOtp && (
            <button
              onClick={() => {
                onClose();
                onOpenOtp();
              }}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4 text-emerald-200" />
              <span>Instant Mobile OTP Login</span>
            </button>
          )}

          <button
            onClick={handleGoLogin}
            className="w-full py-2.5 px-5 rounded-2xl bg-primary hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span>Sign In with Email</span>
          </button>

          <button
            onClick={handleGoRegister}
            className="w-full py-2.5 px-5 rounded-2xl bg-white hover:bg-surface-muted border border-surface-border text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-secondary" />
            <span>Create New Account</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-semibold text-charcoal-light hover:text-charcoal transition-colors"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
