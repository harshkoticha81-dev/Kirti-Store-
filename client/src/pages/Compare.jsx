import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftRight, 
  Trash2, 
  ShoppingCart, 
  Star, 
  Check, 
  X, 
  Plus, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';

const Compare = () => {
  const { compareItems, removeFromCompare, clearCompare, addToCompare } = useCompare();
  const { addToCart } = useCart();
  const [allProducts, setAllProducts] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/products?limit=50');
        if (res.data.success) {
          setAllProducts(res.data.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch catalog for compare page', err);
      }
    };
    fetchCatalog();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Extract unique spec keys across all compared products
  const specKeys = Array.from(
    new Set(
      compareItems.flatMap((p) => (p.specifications || []).map((s) => s.key))
    )
  );

  const filteredCatalog = allProducts.filter(
    (p) =>
      !compareItems.some((c) => (c._id || c.id) === (p._id || p.id)) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (compareItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-6">
          <ArrowLeftRight className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-primary mb-3">Compare Kitchen Appliances</h1>
        <p className="text-sm text-charcoal-light max-w-lg mx-auto mb-8">
          You haven't added any appliances to compare yet. Browse our catalog and click the comparison icon on any product to see wattage, motor specs, capacity, and prices side-by-side.
        </p>

        {/* Quick Suggestion Cards */}
        <div className="max-w-3xl mx-auto mb-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-light mb-4">
            Popular Appliances to Compare
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {allProducts.slice(0, 4).map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-surface-border shadow-sm hover:border-secondary transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=100&q=80'}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-cover border border-surface-border"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary truncate">{p.name}</p>
                    <p className="text-xs font-bold text-secondary">₹{p.sellingPrice?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <button
                  onClick={() => addToCompare(p)}
                  className="px-3 py-1.5 bg-surface-muted hover:bg-secondary hover:text-white rounded-lg text-xs font-bold transition-all text-charcoal flex-shrink-0"
                >
                  + Compare
                </button>
              </div>
            ))}
          </div>
        </div>

        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-zinc-800 transition-all shadow-md"
        >
          <span>Explore Shop Catalog</span>
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
        <Link to="/shop" className="hover:text-primary">Shop</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary font-bold">Appliance Comparison</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary flex items-center gap-3">
            <ArrowLeftRight className="w-7 h-7 text-secondary" />
            <span>Side-by-Side Appliance Comparison</span>
          </h1>
          <p className="text-sm text-charcoal-light mt-1">
            Analyzing {compareItems.length} {compareItems.length === 1 ? 'appliance' : 'appliances'} across technical specifications, power wattage, warranty, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {compareItems.length < 4 && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Appliance ({compareItems.length}/4)</span>
            </button>
          )}
          <button
            onClick={clearCompare}
            className="px-4 py-2 border border-surface-border hover:bg-rose-50 hover:text-rose-600 text-charcoal rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <tbody>
            {/* 1. Product Cards Row */}
            <tr className="border-b border-surface-border">
              <td className="p-5 w-48 bg-surface-muted/40 font-bold text-xs text-charcoal-light uppercase tracking-wider align-top">
                Product Details
              </td>
              {compareItems.map((product) => {
                const discount =
                  product.originalPrice && product.originalPrice > product.sellingPrice
                    ? Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100)
                    : null;

                return (
                  <td key={product._id || product.id} className="p-5 align-top min-w-[220px] max-w-[280px]">
                    <div className="relative group space-y-3">
                      <button
                        onClick={() => removeFromCompare(product._id || product.id)}
                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-surface-border rounded-full text-charcoal-light hover:text-rose-600 shadow-sm transition-all z-10"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-surface-muted/30 border border-surface-border">
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=400&q=80'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {discount && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-accent text-white font-black text-[10px] rounded-lg">
                            {discount}% OFF
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                          {product.categoryName || 'Appliance'}
                        </span>
                        <Link
                          to={`/product/${product.slug || product._id}`}
                          className="block text-sm font-bold text-primary hover:text-secondary line-clamp-2 transition-colors"
                        >
                          {product.name}
                        </Link>
                        <p className="text-[11px] text-charcoal-light">SKU: {product.SKU}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-charcoal">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{product.rating ? product.rating.toFixed(1) : 'New'}</span>
                        <span className="text-charcoal-light">({product.numReviews || 0} reviews)</span>
                      </div>

                      <div className="pt-2 flex items-baseline gap-2">
                        <span className="text-xl font-black text-primary">
                          ₹{product.sellingPrice?.toLocaleString('en-IN')}
                        </span>
                        {product.originalPrice && product.originalPrice > product.sellingPrice && (
                          <span className="text-xs text-charcoal-light line-through">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(product, 1)}
                        disabled={product.stockQuantity <= 0}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          product.stockQuantity <= 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-primary hover:bg-secondary text-white shadow-sm'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* 2. Stock Availability */}
            <tr className="border-b border-surface-border">
              <td className="p-4 bg-surface-muted/40 font-bold text-xs text-charcoal-light uppercase tracking-wider">
                Availability
              </td>
              {compareItems.map((product) => (
                <td key={product._id || product.id} className="p-4">
                  {product.stockQuantity > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      In Stock ({product.stockQuantity} units)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
                      <X className="w-3.5 h-3.5" />
                      Out of Stock
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* 3. Official Warranty Coverage */}
            <tr className="border-b border-surface-border">
              <td className="p-4 bg-surface-muted/40 font-bold text-xs text-charcoal-light uppercase tracking-wider">
                Warranty
              </td>
              {compareItems.map((product) => (
                <td key={product._id || product.id} className="p-4 text-xs font-semibold text-primary">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>{product.warranty || '2 Years Manufacturer Warranty'}</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* 4. Delivery & Returns */}
            <tr className="border-b border-surface-border">
              <td className="p-4 bg-surface-muted/40 font-bold text-xs text-charcoal-light uppercase tracking-wider">
                Fulfillment
              </td>
              {compareItems.map((product) => (
                <td key={product._id || product.id} className="p-4 text-xs text-charcoal">
                  <p className="font-semibold text-emerald-700">Free Express Delivery</p>
                  <p className="text-[11px] text-charcoal-light">7-Day Hassle-Free Replacement</p>
                </td>
              ))}
            </tr>

            {/* 5. Key Specifications Rows */}
            {specKeys.map((key) => (
              <tr key={key} className="border-b border-surface-border hover:bg-surface-muted/10 transition-colors">
                <td className="p-4 bg-surface-muted/40 font-bold text-xs text-charcoal-light uppercase tracking-wider">
                  {key}
                </td>
                {compareItems.map((product) => {
                  const spec = (product.specifications || []).find((s) => s.key === key);
                  return (
                    <td key={product._id || product.id} className="p-4 text-xs text-primary font-medium">
                      {spec?.value || '—'}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* 6. Short Overview Description */}
            <tr className="border-b border-surface-border">
              <td className="p-4 bg-surface-muted/40 font-bold text-xs text-charcoal-light uppercase tracking-wider">
                Key Highlights
              </td>
              {compareItems.map((product) => (
                <td key={product._id || product.id} className="p-4 text-xs text-charcoal-light leading-relaxed">
                  {product.shortDescription || product.description?.substring(0, 140) + '...'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal to add more products */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-surface-border max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <h3 className="font-bold text-lg text-primary">Add Appliance to Comparison</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-charcoal-light hover:text-primary hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              <input
                type="text"
                placeholder="Search by appliance name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-muted text-sm text-primary placeholder-charcoal-light focus:outline-none focus:ring-2 focus:ring-secondary/30"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-surface-border pr-1 space-y-1">
              {filteredCatalog.map((product) => (
                <div key={product._id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=100&q=80'}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover border border-surface-border flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary truncate">{product.name}</p>
                      <p className="text-xs font-bold text-secondary">₹{product.sellingPrice?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      addToCompare(product);
                      setAddModalOpen(false);
                    }}
                    className="px-3 py-1.5 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary-600 transition-colors flex-shrink-0"
                  >
                    Select
                  </button>
                </div>
              ))}
              {filteredCatalog.length === 0 && (
                <p className="py-8 text-center text-xs text-charcoal-light">No additional appliances found matching search.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;
