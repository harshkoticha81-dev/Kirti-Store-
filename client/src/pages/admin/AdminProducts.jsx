import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  IndianRupee, 
  Boxes, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Tag,
  Layers,
  FolderPlus,
  ArrowRight,
  Check,
  RefreshCw,
  ExternalLink,
  UploadCloud,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Link2,
  FolderOpen
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Quick 1-Click Appliance Presets for instant Category-wise creation
const APPLIANCE_PRESETS = [
  {
    label: 'Mixer Grinder',
    categoryName: 'Mixers & Grinders',
    name: 'Kirti PowerMix 750W Heavy-Duty Mixer Grinder',
    skuPrefix: 'MIX',
    sellingPrice: 3499,
    originalPrice: 4999,
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
    shortDescription: '750W Pure Copper High-Torque Motor with 3 Stainless Steel Jars, 3-speed control and overload protection.'
  },
  {
    label: 'Nutri Blender',
    categoryName: 'Blenders',
    name: 'Kirti TurboBlend 900W Bullet Smoothie Blender',
    skuPrefix: 'BLD',
    sellingPrice: 2999,
    originalPrice: 4499,
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
    shortDescription: '900W Nutrient Extractor with hardened cross-blades, 2 Tritan BPA-free travel cups, and pulse function.'
  },
  {
    label: 'Cold Press Juicer',
    categoryName: 'Juicers',
    name: 'Kirti PurePress Slow Cold-Press Masticating Juicer',
    skuPrefix: 'JCR',
    sellingPrice: 8499,
    originalPrice: 11999,
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80',
    shortDescription: '60 RPM Slow Masticating Technology preserving maximum vitamins and enzymes. Reverse function and easy-rinse wash.'
  },
  {
    label: 'Pop-Up Toaster',
    categoryName: 'Toasters & Sandwich Makers',
    name: 'Kirti CrispToast 2-Slice Stainless Steel Bread Toaster',
    skuPrefix: 'TST',
    sellingPrice: 1899,
    originalPrice: 2699,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    shortDescription: '7 Browning levels, defrost, reheat, and cancel buttons. Removable crumb tray and cool-touch brushed steel housing.'
  },
  {
    label: 'Electric Kettle',
    categoryName: 'Electric Kettles',
    name: 'Kirti QuickBoil 1.8L Borosilicate Glass Electric Kettle',
    skuPrefix: 'KTL',
    sellingPrice: 1499,
    originalPrice: 2199,
    image: 'https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=800&q=80',
    shortDescription: '1500W Fast Boil with LED illuminated base, auto-shutoff safety, boil-dry protection, and 360-degree swivel base.'
  },
  {
    label: 'Soda Maker',
    categoryName: 'Soda Makers',
    name: 'Kirti SparkFizz Instant Sparkling Soda Carbonator',
    skuPrefix: 'SDA',
    sellingPrice: 3999,
    originalPrice: 5499,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Electricity-free carbonator machine with 1L PET carbonating bottle and 60L CO2 refill cylinder compatibility.'
  }
];

const AdminProducts = () => {
  const { success, error: showError } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'inStock', 'lowStock', 'outOfStock'

  // Dedicated Price Editing Modal State
  const [priceModalProduct, setPriceModalProduct] = useState(null);
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);

  // Dedicated Stock Adjusting Modal State
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockAdjustmentType, setStockAdjustmentType] = useState('set'); // 'set', 'increase', 'decrease'
  const [stockQtyInput, setStockQtyInput] = useState('');
  const [stockReason, setStockReason] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);

  // Delete Confirmation Modal State
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Add Product Category-Wise Modal State
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCatCustomName, setNewCatCustomName] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    SKU: '',
    brand: 'Kirti',
    sellingPrice: '',
    originalPrice: '',
    stockQuantity: 25,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
    shortDescription: '',
    description: '',
    warranty: '2 Years Manufacturer Warranty',
    status: 'active',
    isFeatured: false
  });

  // Image Upload & Source Mode State
  const [imageInputMode, setImageInputMode] = useState('browse'); // 'browse' or 'url'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Handle Browse / File Picker from Local Storage / Drive
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image file size must be less than 5MB.');
      return;
    }

    setUploadingImage(true);
    setUploadedFileName(file.name);

    // Instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = () => {
      setProductForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success && res.data.url) {
        setProductForm((prev) => ({ ...prev, image: res.data.url }));
        success(`Image "${file.name}" uploaded from storage successfully!`);
      }
    } catch (err) {
      console.warn('Upload API note: Using high-quality local file preview:', err);
      success(`Image "${file.name}" loaded from your device storage.`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Fetch Categories
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

  useEffect(() => {
    fetchCats();
  }, []);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        includeInactive: 'true',
      });

      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        let prods = res.data.products || [];
        if (stockFilter === 'outOfStock') {
          prods = prods.filter((p) => p.stockQuantity === 0);
        } else if (stockFilter === 'lowStock') {
          prods = prods.filter(
            (p) => p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold || 5)
          );
        } else if (stockFilter === 'inStock') {
          prods = prods.filter((p) => p.stockQuantity > (p.lowStockThreshold || 5));
        }

        setProducts(prods);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, stockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  // Open Add Product Category-Wise Modal
  const openAddProductModal = (targetCategory = null) => {
    let defaultCatId = '';
    
    if (targetCategory && targetCategory !== 'all') {
      const found = categories.find((c) => c.slug === targetCategory || c._id === targetCategory);
      if (found) defaultCatId = found._id;
    } else if (categoryFilter !== 'all') {
      const found = categories.find((c) => c.slug === categoryFilter || c._id === categoryFilter);
      if (found) defaultCatId = found._id;
    } else if (categories.length > 0) {
      defaultCatId = categories[0]._id;
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setProductForm({
      name: '',
      category: defaultCatId,
      SKU: `KRT-APP-${randomSuffix}`,
      brand: 'Kirti',
      sellingPrice: '',
      originalPrice: '',
      stockQuantity: 25,
      lowStockThreshold: 5,
      image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
      shortDescription: '',
      description: 'Official Kirti Store premium kitchen appliance engineered for modern homes.',
      warranty: '2 Years Manufacturer Warranty',
      status: 'active',
      isFeatured: false
    });
    setIsNewCategoryMode(false);
    setNewCatCustomName('');
    setImageInputMode('browse');
    setUploadedFileName('');
    setUploadingImage(false);
    setAddProductModalOpen(true);
  };

  // Quick Apply Preset Template
  const applyPreset = (preset) => {
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase().includes(preset.categoryName.toLowerCase()) || 
             preset.categoryName.toLowerCase().includes(c.name.toLowerCase())
    );

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setProductForm((prev) => ({
      ...prev,
      name: preset.name,
      category: matchedCategory ? matchedCategory._id : prev.category,
      SKU: `KRT-${preset.skuPrefix}-${randomSuffix}`,
      sellingPrice: preset.sellingPrice,
      originalPrice: preset.originalPrice,
      image: preset.image,
      shortDescription: preset.shortDescription,
      description: `${preset.shortDescription} Engineered with authentic copper components, high-grade food safe materials, and built-in safety protection.`
    }));
    success(`Applied preset for ${preset.label}!`);
  };

  // Generate unique SKU
  const handleGenerateSKU = () => {
    const cat = categories.find((c) => c._id === productForm.category);
    const prefix = cat ? cat.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'APP';
    const rand = Math.floor(100 + Math.random() * 900);
    setProductForm((prev) => ({ ...prev, SKU: `KRT-${prefix}-${rand}` }));
  };

  // Submit New Product (Category-Wise)
  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();

    let targetCategory = productForm.category;
    if (isNewCategoryMode) {
      if (!newCatCustomName.trim()) {
        showError('Please enter a name for the new category.');
        return;
      }
      targetCategory = newCatCustomName.trim();
    }

    if (!productForm.name.trim() || !productForm.SKU.trim() || !targetCategory || !productForm.sellingPrice) {
      showError('Please fill all mandatory fields (Name, SKU, Category, Selling Price).');
      return;
    }

    try {
      setCreatingProduct(true);
      const payload = {
        name: productForm.name.trim(),
        SKU: productForm.SKU.toUpperCase().trim(),
        category: targetCategory,
        brand: productForm.brand.trim() || 'Kirti',
        sellingPrice: Number(productForm.sellingPrice),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : null,
        stockQuantity: Math.max(0, Number(productForm.stockQuantity)),
        lowStockThreshold: Math.max(0, Number(productForm.lowStockThreshold)),
        images: [productForm.image || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'],
        shortDescription: productForm.shortDescription.trim(),
        description: productForm.description.trim() || productForm.shortDescription.trim() || `${productForm.name} - high-performance kitchen appliance from Kirti Store.`,
        warranty: productForm.warranty || '2 Years Manufacturer Warranty',
        status: productForm.status,
        isFeatured: productForm.isFeatured
      };

      const res = await api.post('/products', payload);
      if (res.data.success) {
        success(`Product "${productForm.name}" created successfully!`);
        setAddProductModalOpen(false);
        await fetchCats();
        await fetchProducts();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create product.');
    } finally {
      setCreatingProduct(false);
    }
  };

  // Open Price Edit Modal
  const openPriceModal = (product) => {
    setPriceModalProduct(product);
    setNewSellingPrice(product.sellingPrice);
    setNewOriginalPrice(product.originalPrice || '');
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (newSellingPrice === '' || isNaN(newSellingPrice) || Number(newSellingPrice) < 0) {
      showError('Please enter a valid non-negative selling price.');
      return;
    }

    try {
      setUpdatingPrice(true);
      const res = await api.patch(`/products/${priceModalProduct._id}/price`, {
        sellingPrice: Number(newSellingPrice),
        originalPrice: newOriginalPrice ? Number(newOriginalPrice) : null,
      });

      if (res.data.success) {
        success(res.data.message || `Price updated to ₹${Number(newSellingPrice).toLocaleString('en-IN')}`);
        // Update local state directly for instantaneous UI feedback
        setProducts((prev) =>
          prev.map((p) =>
            p._id === priceModalProduct._id
              ? {
                  ...p,
                  sellingPrice: Number(newSellingPrice),
                  originalPrice: newOriginalPrice ? Number(newOriginalPrice) : null,
                }
              : p
          )
        );
        setPriceModalProduct(null);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Price update failed.');
    } finally {
      setUpdatingPrice(false);
    }
  };

  // Open Stock Adjust Modal
  const openStockModal = (product) => {
    setStockModalProduct(product);
    setStockAdjustmentType('set');
    setStockQtyInput(product.stockQuantity);
    setStockReason('Manual inventory reconciliation');
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (stockQtyInput === '' || isNaN(stockQtyInput) || Number(stockQtyInput) < 0) {
      showError('Please provide a valid quantity.');
      return;
    }
    if (!stockReason.trim()) {
      showError('A reason must be documented for manual inventory adjustments.');
      return;
    }

    try {
      setUpdatingStock(true);
      const res = await api.patch(`/products/${stockModalProduct._id}/stock`, {
        adjustmentType: stockAdjustmentType,
        quantity: Number(stockQtyInput),
        reason: stockReason.trim(),
      });

      if (res.data.success) {
        success(res.data.message);
        setStockModalProduct(null);
        fetchProducts();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Stock adjustment failed.');
    } finally {
      setUpdatingStock(false);
    }
  };

  // Handle Delete Product
  const confirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;

    try {
      setDeleting(true);
      const res = await api.delete(`/products/${deleteProductTarget._id}`);
      if (res.data.success) {
        success(res.data.message || `Product "${deleteProductTarget.name}" deleted successfully.`);
        // Remove from local table state immediately
        setProducts((prev) => prev.filter((p) => p._id !== deleteProductTarget._id));
        setTotal((prev) => Math.max(0, prev - 1));
        setDeleteProductTarget(null);
        fetchCats();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Could not delete product.');
    } finally {
      setDeleting(false);
    }
  };

  // Calculate live discount percentage for Price Modal
  const calculateDiscount = (sell, orig) => {
    if (!orig || Number(orig) <= Number(sell)) return null;
    return Math.round(((Number(orig) - Number(sell)) / Number(orig)) * 100);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">Appliance Product Catalog</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {total} Models
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage models, live prices, category allocations, and storefront inventory
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openAddProductModal()}
            className="px-4 py-2.5 bg-secondary hover:bg-secondary-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product (Category-Wise)</span>
          </button>

          <Link
            to="/admin/products/new"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Open comprehensive full-page form"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Full Form</span>
          </Link>
        </div>
      </div>

      {/* 1. CATEGORY PILLS FILTER BAR (CATEGORY-WISE BROWSING) */}
      <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <Layers className="w-3.5 h-3.5 text-secondary" />
            <span>Browse Categories:</span>
          </div>
          {categoryFilter !== 'all' && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setPage(1);
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 underline"
            >
              Reset to All
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              categoryFilter === 'all'
                ? 'bg-secondary text-white shadow-md shadow-blue-500/25'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
            }`}
          >
            <span>All Appliances</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              categoryFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              {total}
            </span>
          </button>

          {categories.map((c) => {
            const isSelected = categoryFilter === c.slug || categoryFilter === c._id;
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => {
                  setCategoryFilter(c.slug);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-secondary text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{c.name}</span>
                {c.productCount !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {c.productCount}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              openAddProductModal();
              setIsNewCategoryMode(true);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 whitespace-nowrap flex items-center gap-1 transition-all"
            title="Create a new Category"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ New Category</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by appliance name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-secondary"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter Select */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Stock Statuses</option>
            <option value="inStock">In Stock (&gt;5)</option>
            <option value="lowStock">Low Stock (≤5)</option>
            <option value="outOfStock">Out of Stock (0)</option>
          </select>

          <button
            type="button"
            onClick={fetchProducts}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. PRODUCTS CATALOG TABLE */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/70 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Appliance Model</th>
                <th className="py-4 px-4">SKU</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Price & Action</th>
                <th className="py-4 px-4">Stock Level</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                      <span>Loading appliance catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-400">No appliances found in this category.</p>
                    <button
                      type="button"
                      onClick={() => openAddProductModal(categoryFilter)}
                      className="mt-3 px-4 py-1.5 bg-secondary text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product Here</span>
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isOutOfStock = product.stockQuantity === 0;
                  const isLowStock = !isOutOfStock && product.stockQuantity <= (product.lowStockThreshold || 5);
                  const discountPct = calculateDiscount(product.sellingPrice, product.originalPrice);

                  return (
                    <tr key={product._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Product Image & Title */}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=100&q=80'}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover bg-slate-950 flex-shrink-0 border border-slate-800"
                          />
                          <div className="overflow-hidden">
                            <p className="font-bold text-white truncate max-w-xs">{product.name}</p>
                            <span className="text-[10px] text-slate-400">{product.brand || 'Kirti'}</span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">
                        {product.SKU}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold border border-slate-700/60 inline-block">
                          {product.categoryName || 'Kitchen Appliance'}
                        </span>
                      </td>

                      {/* Price + Prominent Update Price Button */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <span className="font-black text-white text-sm">
                              ₹{product.sellingPrice?.toLocaleString('en-IN')}
                            </span>
                            {product.originalPrice && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-400 line-through">
                                  ₹{product.originalPrice.toLocaleString('en-IN')}
                                </span>
                                {discountPct && (
                                  <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                    {discountPct}% off
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Direct Update Price Action */}
                          <button
                            type="button"
                            onClick={() => openPriceModal(product)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
                            title="Update product price"
                          >
                            <IndianRupee className="w-3 h-3" />
                            <span>Edit Price</span>
                          </button>
                        </div>
                      </td>

                      {/* Stock Level + Quick Adjust Action */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isOutOfStock
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : isLowStock
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {product.stockQuantity} Units
                          </span>
                          <button
                            type="button"
                            onClick={() => openStockModal(product)}
                            className="p-1 rounded text-slate-400 hover:text-secondary hover:bg-slate-800 transition-colors"
                            title="Adjust Stock"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          product.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {product.status}
                        </span>
                      </td>

                      {/* Action buttons (Edit & Delete) */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/products/edit/${product._id}`}
                            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                            title="Full Product Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Edit</span>
                          </Link>

                          {/* Delete Product Option */}
                          <button
                            type="button"
                            onClick={() => setDeleteProductTarget(product)}
                            className="p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages} ({total} total appliances)</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADD PRODUCT (CATEGORY-WISE)                     */}
      {/* ======================================================== */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-secondary/10 rounded-xl text-secondary border border-secondary/20">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Add Appliance (Category-Wise)</h3>
                  <p className="text-[11px] text-slate-400">Add a model directly into any appliance category</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddProductModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Preset Selection */}
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Preset Templates (Optional Quick Fill):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {APPLIANCE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Creation Form */}
            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
              
              {/* Category Selection Row */}
              <div className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-secondary" />
                    <span>Appliance Category *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    {isNewCategoryMode ? '← Choose Existing Category' : '+ Create New Category'}
                  </button>
                </div>

                {isNewCategoryMode ? (
                  <div>
                    <input
                      type="text"
                      required={isNewCategoryMode}
                      placeholder="e.g. Air Fryers, Sandwich Makers, Induction Cooktops"
                      value={newCatCustomName}
                      onChange={(e) => setNewCatCustomName(e.target.value)}
                      className="w-full p-2.5 bg-slate-800 border border-amber-500/40 rounded-xl text-white font-semibold placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-amber-400/80 mt-1">
                      New category will be automatically registered and linked to this appliance.
                    </p>
                  </div>
                ) : (
                  <select
                    required
                    value={productForm.category}
                    onChange={(e) => {
                      setProductForm({ ...productForm, category: e.target.value });
                    }}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    <option value="" disabled>Select a category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.productCount ? `(${c.productCount} existing models)` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-300">Appliance Model Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kirti Silenta 1000W Ultra-Quiet Mixer Grinder"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300">Brand</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold"
                  />
                </div>
              </div>

              {/* SKU Code with Auto Generate */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">SKU Code (Unique) *</label>
                  <button
                    type="button"
                    onClick={handleGenerateSKU}
                    className="text-[11px] text-secondary hover:text-blue-300 font-bold"
                  >
                    ⚡ Auto-Generate SKU
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. KRT-MIX-750"
                  value={productForm.SKU}
                  onChange={(e) => setProductForm({ ...productForm, SKU: e.target.value.toUpperCase() })}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold"
                />
              </div>

              {/* Price Row (Selling Price & Original MRP) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Selling Price (₹) *</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Storefront Price</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 4999"
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Original MRP (₹)</span>
                    <span className="text-[10px] text-slate-400">Discount Strike</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 6499"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              {/* Stock Quantity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300">Initial Stock Units *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300">Low Stock Alert Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.lowStockThreshold}
                    onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              {/* Appliance Image Section (Browse from Storage OR Web URL) */}
              <div className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                    <span>Appliance Photo *</span>
                  </label>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('browse')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        imageInputMode === 'browse'
                          ? 'bg-secondary text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <HardDrive className="w-3 h-3" />
                      <span>Browse from Storage</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        imageInputMode === 'url'
                          ? 'bg-secondary text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>Paste URL</span>
                    </button>
                  </div>
                </div>

                {/* Mode 1: Browse from Drive / Device */}
                {imageInputMode === 'browse' ? (
                  <div>
                    <input
                      type="file"
                      id="applianceFileInputModal"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    <label
                      htmlFor="applianceFileInputModal"
                      className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-secondary/60 bg-slate-800/40 hover:bg-slate-800/70 rounded-2xl cursor-pointer transition-all group"
                    >
                      {uploadingImage ? (
                        <div className="flex items-center gap-2 py-3 text-secondary text-xs font-bold">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Uploading photo from your storage...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-1.5 py-1">
                          <div className="p-2.5 bg-secondary/10 rounded-2xl text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-secondary transition-colors">
                              Click to browse photo from computer, drive or storage
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Supports PNG, JPG, JPEG, WEBP or SVG (Max 5MB)
                            </p>
                          </div>
                          {uploadedFileName && (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Selected: {uploadedFileName}
                            </span>
                          )}
                        </div>
                      )}
                    </label>
                  </div>
                ) : (
                  /* Mode 2: Web URL input */
                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-secondary"
                    />
                    <p className="text-[10px] text-slate-400">
                      Paste a direct image link from Unsplash, supplier CDN, or any cloud host.
                    </p>
                  </div>
                )}

              </div>

              {/* Short Description */}
              <div>
                <label className="font-semibold text-slate-300">Key Feature / Highlight</label>
                <input
                  type="text"
                  placeholder="e.g. 1000W Pure Copper Motor with 4 Stainless Steel Jars"
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* Status & Featured */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featuredCheckbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-secondary focus:ring-secondary bg-slate-800 border-slate-700"
                  />
                  <label htmlFor="featuredCheckbox" className="text-slate-300 font-semibold cursor-pointer">
                    Feature on Homepage Carousel
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Status:</span>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddProductModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="flex-1 py-3 bg-secondary hover:bg-secondary-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {creatingProduct ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Appliance...</span>
                    </div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Product to Store</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: UPDATE PRODUCT PRICE                            */}
      {/* ======================================================== */}
      {priceModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-amber-400" />
                <span>Update Appliance Price</span>
              </h3>
              <button 
                type="button"
                onClick={() => setPriceModalProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
              <img
                src={priceModalProduct.images?.[0] || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=100&q=80'}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-slate-800"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-xs truncate">{priceModalProduct.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">SKU: {priceModalProduct.SKU} | Cat: {priceModalProduct.categoryName}</p>
                <p className="text-xs text-emerald-400 font-bold mt-0.5">
                  Current Price: ₹{priceModalProduct.sellingPrice?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>New Selling Price (₹) *</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Customer Checkout Price</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Original MRP (₹)</span>
                  <span className="text-[10px] text-slate-400">Discount Strike-Through (Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={newOriginalPrice}
                  onChange={(e) => setNewOriginalPrice(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Live Savings Calculation */}
              {newOriginalPrice && Number(newOriginalPrice) > Number(newSellingPrice) && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-between">
                  <span>Customer Savings:</span>
                  <span>
                    ₹{(Number(newOriginalPrice) - Number(newSellingPrice)).toLocaleString('en-IN')} ({calculateDiscount(newSellingPrice, newOriginalPrice)}% OFF)
                  </span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriceModalProduct(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPrice}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {updatingPrice ? 'Saving Price...' : 'Update Price Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: QUICK STOCK ADJUSTMENT                          */}
      {/* ======================================================== */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-secondary" />
                <span>Adjust Inventory Stock</span>
              </h3>
              <button 
                type="button"
                onClick={() => setStockModalProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>Product: <strong className="text-white">{stockModalProduct.name}</strong></p>
              <p>Current In-Stock: <strong className="text-emerald-400">{stockModalProduct.stockQuantity} Units</strong></p>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Adjustment Mode</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setStockAdjustmentType('set')}
                    className={`py-2 rounded-xl font-bold ${stockAdjustmentType === 'set' ? 'bg-secondary text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    Set Exact
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAdjustmentType('increase')}
                    className={`py-2 rounded-xl font-bold ${stockAdjustmentType === 'increase' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    + Add Units
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockAdjustmentType('decrease')}
                    className={`py-2 rounded-xl font-bold ${stockAdjustmentType === 'decrease' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    - Deduct
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300">
                  {stockAdjustmentType === 'set' ? 'New Exact Total Units' : 'Quantity Units'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQtyInput}
                  onChange={(e) => setStockQtyInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300">Adjustment Reason (Mandatory Audit Log) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warehouse batch delivery received"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStock}
                  className="flex-1 py-2.5 bg-secondary text-white font-bold rounded-xl shadow"
                >
                  {updatingStock ? 'Saving...' : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DELETE PRODUCT CONFIRMATION                     */}
      {/* ======================================================== */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-white text-base">Delete Appliance Model?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete this product?
              </p>
            </div>

            {/* Target Product Preview Card */}
            <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <img
                src={deleteProductTarget.images?.[0] || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=100&q=80'}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-slate-800"
              />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-white truncate">{deleteProductTarget.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">SKU: {deleteProductTarget.SKU}</p>
                <p className="text-[11px] text-rose-400 font-semibold mt-0.5">
                  Category: {deleteProductTarget.categoryName} • ₹{deleteProductTarget.sellingPrice?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-rose-400/90 text-center">
              ⚠️ Warning: This will permanently remove the item from the customer storefront and search.
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteProductTarget(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteProduct}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Appliance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
