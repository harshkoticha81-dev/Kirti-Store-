import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  X, 
  ShieldCheck, 
  LogOut, 
  Package, 
  SlidersHorizontal,
  Flame,
  ArrowLeftRight,
  Truck,
  BookOpen,
  ArrowRight,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import NotificationBell from './NotificationBell';
import { getSafeProductImageUrl, getApplianceFallbackImage } from '../../utils/imageUtils';
import api from '../../services/api';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart, setCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { compareCount } = useCompare();
  const [searchTerm, setSearchTerm] = useState('');
  const [liveResults, setLiveResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Instant live search debounced
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(searchTerm.trim())}&limit=5`);
        if (res.data.success) {
          setLiveResults(res.data.products || []);
        }
      } catch (err) {
        console.error('Instant search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close search preview
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setSearchFocused(false);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop All', path: '/shop' },
    { name: 'Categories', path: '/shop?view=categories' },
    { name: 'Track Order', path: '/track-order' },
    { name: 'Deals', path: '/deals' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0" title="Kirti Store Home">
            <img 
              src="/logo-color.png" 
              alt="Kirti Store" 
              className="h-10 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
          </Link>

          {/* Desktop Search Bar with Live Instant Autocomplete */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative" ref={searchContainerRef}>
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="Search blenders, mixers, juicers, toasters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full pl-11 pr-9 py-2.5 bg-surface-muted border border-surface-border rounded-full text-sm text-charcoal placeholder-charcoal-light focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              />
              <Search className="w-4 h-4 text-charcoal-light absolute left-4 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setLiveResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Instant Search Autocomplete Dropdown */}
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-surface-border p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                {searchTerm.trim().length >= 2 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-charcoal-light uppercase tracking-wider">
                      <span>Matching Appliances</span>
                      {isSearching && <span className="text-secondary animate-pulse">Searching...</span>}
                    </div>

                    {liveResults.length > 0 ? (
                      <div className="divide-y divide-surface-border max-h-72 overflow-y-auto">
                        {liveResults.map((product) => (
                          <Link
                            key={product._id}
                            to={`/product/${product.slug || product._id}`}
                            onClick={() => {
                              setSearchFocused(false);
                              setSearchTerm('');
                            }}
                            className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-surface-muted/60 p-2 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={getSafeProductImageUrl(product.images?.[0], product.categoryName || product.name)}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg border border-surface-border flex-shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getApplianceFallbackImage(product.categoryName || product.name);
                                }}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-primary truncate">{product.name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-charcoal-light">
                                  <span>{product.categoryName}</span>
                                  {product.rating > 0 && (
                                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                      <Star className="w-2.5 h-2.5 fill-current" />
                                      {product.rating.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="text-xs font-black text-secondary flex-shrink-0">
                              ₹{product.sellingPrice?.toLocaleString('en-IN')}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : !isSearching ? (
                      <p className="py-4 text-center text-xs text-charcoal-light">
                        No appliances found for "{searchTerm}".
                      </p>
                    ) : null}

                    <button
                      onClick={handleSearch}
                      className="w-full pt-2 border-t border-surface-border text-center text-xs font-bold text-secondary hover:text-secondary-700 flex items-center justify-center gap-1.5"
                    >
                      <span>View all results for "{searchTerm}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-charcoal-light uppercase tracking-wider">
                      Popular Searches
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['750W Mixer Grinder', 'Cold Press Juicer', 'Air Fryer 6.5L', 'Soda Maker', 'Electric Kettle'].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setSearchTerm(term);
                            navigate(`/shop?search=${encodeURIComponent(term)}`);
                            setSearchFocused(false);
                          }}
                          className="px-2.5 py-1 bg-surface-muted hover:bg-secondary/10 hover:text-secondary text-charcoal rounded-lg text-xs font-medium transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation Icons & Account */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Compare Link */}
            <Link
              to="/compare"
              className="relative p-2.5 rounded-full text-charcoal hover:text-secondary hover:bg-surface-muted transition-colors"
              title="Compare Appliances"
            >
              <ArrowLeftRight className="w-5 h-5" />
              {compareCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-secondary text-white text-[11px] font-bold flex items-center justify-center shadow">
                  {compareCount}
                </span>
              )}
            </Link>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative p-2.5 rounded-full text-charcoal hover:text-secondary hover:bg-surface-muted transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center shadow">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Push Notifications Bell */}
            <NotificationBell />

            {/* Cart Trigger */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-full text-charcoal hover:text-secondary hover:bg-surface-muted transition-colors flex items-center gap-2"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-secondary text-white text-[11px] font-bold flex items-center justify-center shadow">
                    {cart.itemCount}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline text-xs font-bold text-primary">
                ₹{cart.subtotal.toLocaleString('en-IN')}
              </span>
            </button>

            {/* User Dropdown / Auth Menu */}
            <div className="relative">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-full border border-surface-border hover:border-secondary bg-surface-muted transition-all text-sm font-semibold text-primary"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-premium border border-surface-border py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-surface-border">
                        <p className="text-xs font-medium text-charcoal-light">Signed in as</p>
                        <p className="text-sm font-bold text-primary truncate">{user.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold bg-zinc-900 text-white rounded-full">
                            Administrator
                          </span>
                        )}
                      </div>

                      <Link
                        to="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-charcoal hover:bg-surface-muted"
                      >
                        <User className="w-4 h-4 text-charcoal-light" />
                        My Profile & Orders
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-secondary hover:bg-blue-50"
                        >
                          <ShieldCheck className="w-4 h-4 text-secondary" />
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs sm:text-sm font-semibold text-primary hover:text-secondary py-2 px-3 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex text-xs sm:text-sm font-semibold bg-secondary hover:bg-secondary-700 text-white px-4 py-2 rounded-full transition-colors shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-charcoal hover:bg-surface-muted"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Category Navigation Row */}
        <nav className="hidden lg:flex items-center justify-between py-2 border-t border-surface-border text-sm font-medium">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`inline-flex items-center gap-1.5 transition-colors py-1 ${
                    isActive
                      ? 'text-zinc-950 font-bold border-b-2 border-zinc-950'
                      : 'text-charcoal hover:text-zinc-950'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-surface-border px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search appliances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-muted border border-surface-border rounded-xl text-sm text-charcoal"
            />
            <Search className="w-4 h-4 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          {/* Links */}
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-surface-muted flex items-center justify-between"
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {!isAuthenticated && (
            <div className="pt-2 border-t border-surface-border flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-sm font-semibold border border-primary text-primary rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-sm font-semibold bg-secondary text-white rounded-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
