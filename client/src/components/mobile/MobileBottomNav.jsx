import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Heart, ShoppingBag, User } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

/**
 * MobileBottomNav
 * Fixed mobile bottom navigation bar providing seamless thumb-friendly
 * navigation for Android and iOS users, with badges and native haptic feedback.
 */
const MobileBottomNav = () => {
  const location = useLocation();
  const { cart, setCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  const currentPath = location.pathname;

  // Hide bottom nav on admin portal or during critical multi-step checkout
  if (currentPath.startsWith('/admin') || currentPath === '/checkout') {
    return null;
  }

  const triggerHaptic = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch {
      // Haptics gracefully skipped if unavailable
    }
  };

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home,
      isActive: currentPath === '/',
    },
    {
      name: 'Shop',
      path: '/shop',
      icon: LayoutGrid,
      isActive: currentPath.startsWith('/shop') || currentPath.startsWith('/product'),
    },
    {
      name: 'Wishlist',
      path: '/wishlist',
      icon: Heart,
      badge: wishlist?.length || 0,
      isActive: currentPath === '/wishlist',
    },
    {
      name: 'Cart',
      isCartButton: true,
      icon: ShoppingBag,
      badge: cart?.itemCount || 0,
      isActive: currentPath === '/cart',
    },
    {
      name: 'Account',
      path: isAuthenticated ? '/account' : '/login',
      icon: User,
      badge: unreadCount || 0,
      isActive: currentPath === '/account' || currentPath === '/login' || currentPath === '/register',
    },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-surface-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          if (item.isCartButton) {
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setCartOpen(true);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
                  active ? 'text-secondary font-bold' : 'text-charcoal-light hover:text-charcoal'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110 text-secondary' : ''}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-secondary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight ${active ? 'font-bold text-secondary' : 'font-medium'}`}>
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={triggerHaptic}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
                active ? 'text-secondary font-bold' : 'text-charcoal-light hover:text-charcoal'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110 text-secondary' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${active ? 'font-bold text-secondary' : 'font-medium'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
