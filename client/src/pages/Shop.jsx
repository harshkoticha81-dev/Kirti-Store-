import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  X, 
  ArrowUpDown, 
  Check, 
  RotateCcw,
  PackageOpen,
  PlusCircle
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/common/LoadingSkeleton';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter & Search states from query parameters
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const isFeatured = searchParams.get('isFeatured') === 'true';

  // Local inputs for search and price range
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

  // Sync state if URL changes externally
  useEffect(() => {
    setSearchInput(currentSearch);
    setMinPriceInput(currentMinPrice);
    setMaxPriceInput(currentMaxPrice);
  }, [currentSearch, currentMinPrice, currentMaxPrice]);

  // Fetch Categories once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products based on searchParams
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(searchParams);
        if (!params.has('limit')) params.set('limit', '12');

        const res = await api.get(`/products?${params.toString()}`);
        if (res.data.success) {
          setProducts(res.data.products || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        console.error('[Shop Products Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  // Update URL helper
  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === 'all') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    // Reset to page 1 on any filter change except page
    if (!newParams.hasOwnProperty('page')) {
      updated.set('page', '1');
    }
    setSearchParams(updated);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const handlePriceFilterSubmit = (e) => {
    e.preventDefault();
    updateFilters({ minPrice: minPriceInput, maxPrice: maxPriceInput });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Shop Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-surface-border">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">
            Kitchen Appliances Catalog
          </h1>
          <p className="text-sm text-charcoal-light mt-1">
            Showing <strong className="text-primary font-bold">{total}</strong> premium products
            {currentCategory !== 'all' && ` in ${categories.find(c => c.slug === currentCategory)?.name || currentCategory}`}
            {currentSearch && ` matching "${currentSearch}"`}
          </p>
        </div>

        {/* Sort selector & Mobile filter trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-border rounded-xl text-sm font-semibold text-charcoal shadow-sm"
          >
            <Filter className="w-4 h-4 text-secondary" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-surface-border rounded-xl px-3 py-2 shadow-sm">
            <ArrowUpDown className="w-4 h-4 text-charcoal-light" />
            <span className="text-xs font-semibold text-charcoal-light hidden sm:inline">Sort:</span>
            <select
              value={currentSort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="bg-transparent text-sm font-semibold text-primary focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        
        {/* DESKTOP SIDEBAR FILTER */}
        <aside className="hidden lg:block lg:col-span-1 space-y-8 pr-4">
          
          {/* Active Filter Clear Header */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-secondary" />
              <span>Filter Products</span>
            </h3>
            {(currentCategory !== 'all' || currentSearch || currentMinPrice || currentMaxPrice || currentInStock || isFeatured) && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-light">
              Keyword Search
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Product name, SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface-muted border border-surface-border rounded-xl text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <Search className="w-3.5 h-3.5 text-charcoal-light absolute left-3 top-1/2 -translate-y-1/2" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilters({ search: '' });
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>

          {/* Category Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-light">
              Categories
            </label>
            <div className="space-y-1 text-sm">
              <button
                onClick={() => updateFilters({ category: 'all' })}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                  currentCategory === 'all'
                    ? 'bg-secondary text-white font-bold'
                    : 'text-charcoal hover:bg-surface-muted'
                }`}
              >
                <span>All Categories</span>
                <span className="text-xs opacity-75">{total}</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateFilters({ category: cat.slug })}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                    currentCategory === cat.slug
                      ? 'bg-secondary text-white font-bold'
                      : 'text-charcoal hover:bg-surface-muted'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-xs opacity-75">{cat.productCount || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-light">
              Price Range (₹)
            </label>
            <form onSubmit={handlePriceFilterSubmit} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-1/2 px-3 py-1.5 bg-surface-muted border border-surface-border rounded-xl text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
                  min="0"
                />
                <span className="text-charcoal-light text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-1/2 px-3 py-1.5 bg-surface-muted border border-surface-border rounded-xl text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
                  min="0"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-primary hover:bg-primary-900 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Apply Price Filter
              </button>
            </form>
          </div>

          {/* Availability checkbox */}
          <div className="space-y-2 pt-2 border-t border-surface-border">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={currentInStock}
                onChange={(e) => updateFilters({ inStock: e.target.checked ? 'true' : '' })}
                className="w-4 h-4 rounded text-secondary border-surface-border focus:ring-secondary cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>
          </div>

          {/* Featured toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => updateFilters({ isFeatured: e.target.checked ? 'true' : '' })}
                className="w-4 h-4 rounded text-secondary border-surface-border focus:ring-secondary cursor-pointer"
              />
              <span>Featured Bestsellers</span>
            </label>
          </div>

        </aside>

        {/* PRODUCT GRID & RESULTS */}
        <main className="lg:col-span-3">
          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : products.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-surface-border p-8 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-secondary flex items-center justify-center mx-auto shadow-sm">
                <PackageOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">
                  {total === 0 && !currentSearch && currentCategory === 'all'
                    ? 'Catalog Ready for Your Appliances!'
                    : 'No Appliances Found'}
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-light max-w-md mx-auto mt-1">
                  {total === 0 && !currentSearch && currentCategory === 'all'
                    ? 'All default products have been cleanly removed as requested. You can now add your custom kitchen appliances through the Admin Panel.'
                    : "We couldn't find any kitchen appliances matching your search criteria. Try modifying your price filters or searching with another term."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {total === 0 && !currentSearch && currentCategory === 'all' ? (
                  <Link
                    to="/admin/products"
                    className="px-6 py-2.5 bg-primary hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>Go to Admin: Add Appliances</span>
                  </Link>
                ) : (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 bg-secondary text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-secondary-700 transition-colors shadow-sm"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => updateFilters({ page: currentPage - 1 })}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-surface-border bg-white text-charcoal hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateFilters({ page: pageNum })}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                          currentPage === pageNum
                            ? 'bg-secondary text-white shadow-sm'
                            : 'bg-white border border-surface-border text-charcoal hover:bg-surface-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => updateFilters({ page: currentPage + 1 })}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-surface-border bg-white text-charcoal hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>

      </div>

      {/* MOBILE DRAWER FILTERS */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div 
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                  <h3 className="font-bold text-primary text-base">Filter Appliances</h3>
                  <button onClick={() => setMobileFilterOpen(false)}>
                    <X className="w-5 h-5 text-charcoal-light" />
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-charcoal-light">Categories</label>
                  <select
                    value={currentCategory}
                    onChange={(e) => updateFilters({ category: e.target.value })}
                    className="w-full p-2.5 bg-surface-muted border border-surface-border rounded-xl text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* In stock */}
                <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
                  <input
                    type="checkbox"
                    checked={currentInStock}
                    onChange={(e) => updateFilters({ inStock: e.target.checked ? 'true' : '' })}
                    className="w-4 h-4 text-secondary rounded"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              <div className="pt-6 border-t border-surface-border flex gap-2">
                <button
                  onClick={() => {
                    clearAllFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="flex-1 py-2.5 text-xs font-bold border border-slate-300 rounded-xl"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold bg-secondary text-white rounded-xl shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Shop;
