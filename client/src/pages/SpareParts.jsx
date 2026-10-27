import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  HelpCircle, 
  X, 
  ShoppingCart, 
  ArrowRight, 
  Filter, 
  ChevronRight,
  Info,
  Sparkles,
  PhoneCall,
  Check,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const SpareParts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialModel = searchParams.get('model') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [spares, setSpares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modelsData, setModelsData] = useState({
    models: [],
    appliances: [],
    applianceTypes: [],
    partCategories: []
  });

  // Filter States
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [selectedApplianceType, setSelectedApplianceType] = useState('all');
  const [selectedPartCategory, setSelectedPartCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModelGuide, setShowModelGuide] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const { addToCart, setCartOpen } = useCart();
  const { success, error: showError } = useToast();

  // Load models and categories metadata
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await api.get('/products/spares/models');
        if (res.data.success) {
          setModelsData(res.data);
        }
      } catch (err) {
        console.error('Failed to load spare models metadata', err);
      }
    };
    fetchModels();
  }, []);

  // Fetch spare parts based on active filters
  useEffect(() => {
    const fetchSpares = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('isSparePart', 'true');
        params.append('limit', '50');

        if (selectedModel && selectedModel !== 'all') {
          params.append('model', selectedModel);
        }
        if (selectedPartCategory && selectedPartCategory !== 'all') {
          params.append('partCategory', selectedPartCategory);
        }
        if (selectedApplianceType && selectedApplianceType !== 'all') {
          params.append('applianceType', selectedApplianceType);
        }
        if (searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }

        const res = await api.get(`/products?${params.toString()}`);
        if (res.data.success) {
          setSpares(res.data.products || []);
        }
      } catch (err) {
        console.error('Failed to load spare parts', err);
        showError('Could not load spare parts.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpares();
  }, [selectedModel, selectedPartCategory, selectedApplianceType, searchTerm]);

  // Handle instant Add to Cart
  const handleAddToCart = (part, openDrawer = true) => {
    setAddingId(part._id);
    addToCart(part, 1);
    success(`Added ${part.name} to cart.`);
    if (openDrawer) {
      setCartOpen(true);
    }
    setTimeout(() => setAddingId(null), 600);
  };

  // Clear all filters
  const resetFilters = () => {
    setSelectedModel('');
    setSelectedApplianceType('all');
    setSelectedPartCategory('all');
    setSearchTerm('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% OEM Certified Genuine Spare Parts</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Never Replace The Whole Machine.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">
                Fix It With Genuine Spares.
              </span>
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              A cracked jar lid, worn rubber gasket, or broken motor coupler shouldn’t retire your favorite kitchen companion. Filter by your model number for 100% factory-guaranteed fitment.
            </p>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 w-full max-w-3xl">
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>100% Direct Fit</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-200">
                <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>24h Fast Dispatch</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-200">
                <RefreshCw className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>7-Day Fit Guarantee</span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-200">
                <Wrench className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>DIY Ready Install</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE "FIND SPARES FOR YOUR MODEL" TOOL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Model Compatibility Engine
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Find Compatible Spares for Your Appliance
              </h2>
            </div>

            <button
              onClick={() => setShowModelGuide(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-600 transition-colors bg-slate-100 hover:bg-amber-50 px-3.5 py-2 rounded-xl border border-slate-200 self-start md:self-auto"
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Where do I find my Model Number?</span>
            </button>
          </div>

          {/* 3 Step Interactive Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
            
            {/* Step 1: Appliance Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">1</span>
                Appliance Type
              </label>
              <select
                value={selectedApplianceType}
                onChange={(e) => {
                  setSelectedApplianceType(e.target.value);
                  // clear specific model if type changed
                  setSelectedModel('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                <option value="all">All Appliance Types</option>
                {modelsData.applianceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Appliance Model */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">2</span>
                Appliance Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                <option value="">-- Choose Your Appliance Model --</option>
                {modelsData.models.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Step 3: Quick Search by Part Keyword */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">3</span>
                Part Keyword or SKU
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. chutney jar, gasket, coupler..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Part Category Filter Pills */}
          <div className="pt-6 border-t border-slate-100 mt-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Filter by Part Category:
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {(modelsData.partCategories.length > 0 ? modelsData.partCategories : [
                { id: 'all', name: 'All Spare Parts' },
                { id: 'jars', name: 'Jars & Bowls' },
                { id: 'blades', name: 'Blades' },
                { id: 'lids', name: 'Lids & Caps' },
                { id: 'gaskets', name: 'Rubber Gaskets' },
                { id: 'couplers', name: 'Drive Couplers' },
                { id: 'filters', name: 'Filters' },
                { id: 'other', name: 'Accessories' }
              ]).map((cat) => {
                const isActive = selectedPartCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedPartCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                      isActive 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Summary Bar */}
          {(selectedModel || selectedApplianceType !== 'all' || selectedPartCategory !== 'all' || searchTerm) && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-500">Active Filters:</span>
                
                {selectedModel && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Model: {selectedModel}
                    <button onClick={() => setSelectedModel('')} className="hover:text-emerald-950">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedApplianceType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                    Type: {selectedApplianceType}
                    <button onClick={() => setSelectedApplianceType('all')} className="hover:text-amber-950">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedPartCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold">
                    Category: {selectedPartCategory}
                    <button onClick={() => setSelectedPartCategory('all')} className="hover:text-blue-950">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchTerm && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                    Keyword: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:text-slate-950">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
              >
                Clear All Filters
              </button>
            </div>
          )}

        </div>
      </section>

      {/* 3. SPARE PARTS RESULTS CATALOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              {selectedModel ? (
                <span>Spares Compatible with <span className="text-amber-600 font-black">{selectedModel}</span></span>
              ) : (
                'Genuine Replacement Spares & Accessories'
              )}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Showing {spares.length} factory-certified spare parts and replacement assemblies.
            </p>
          </div>

          {selectedModel && (
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800">
                100% Fitment Guaranteed for {selectedModel}
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
                <div className="aspect-square bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : spares.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">No matching spare parts found</h4>
              <p className="text-xs text-slate-500 mt-1">
                We couldn't find exact spare parts matching your current filter combination.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                View All Spare Parts
              </button>
              <a
                href="https://wa.me/919876543210?text=Hi%20Kirti%20Store,%20I%20need%20a%20spare%20part%20for%20my%20appliance"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Ask on WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {spares.map((part) => {
              const isMatchSelected = selectedModel && part.compatibleModels?.some(
                m => m.toLowerCase().includes(selectedModel.toLowerCase())
              );
              const discount = part.originalPrice && part.originalPrice > part.sellingPrice
                ? Math.round(((part.originalPrice - part.sellingPrice) / part.originalPrice) * 100)
                : null;

              return (
                <div
                  key={part._id}
                  className={`group bg-white rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden hover:shadow-xl ${
                    isMatchSelected 
                      ? 'border-emerald-300 shadow-md ring-2 ring-emerald-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  
                  {/* Image & Badges */}
                  <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                    <img
                      src={part.images?.[0] || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80'}
                      alt={part.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* OEM Genuine Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider uppercase">
                        OEM Genuine
                      </span>
                      {discount && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase">
                          Save {discount}%
                        </span>
                      )}
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold backdrop-blur-md ${
                        part.stockQuantity > 0 
                          ? 'bg-emerald-500/90 text-white' 
                          : 'bg-rose-500/90 text-white'
                      }`}>
                        {part.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Guaranteed Fit Pill */}
                    {isMatchSelected && (
                      <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white py-1 px-3 text-[11px] font-bold flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Guaranteed Fit for {selectedModel}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    
                    <div className="space-y-2">
                      {/* Part Number & Category */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                        <span className="uppercase tracking-wider">
                          {part.partNumber ? `Part #${part.partNumber}` : part.SKU}
                        </span>
                        <span className="text-amber-600 font-bold capitalize">
                          {part.sparePartCategory}
                        </span>
                      </div>

                      {/* Part Name */}
                      <Link 
                        to={`/product/${part._id}`}
                        className="block font-bold text-slate-900 hover:text-amber-600 transition-colors text-sm line-clamp-2 leading-snug"
                        title={part.name}
                      >
                        {part.name}
                      </Link>

                      {/* Short Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {part.shortDescription || part.description}
                      </p>

                      {/* Compatible Models Tags */}
                      {part.compatibleModels && part.compatibleModels.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Compatible With:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {part.compatibleModels.slice(0, 3).map((mod, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedModel(mod)}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                                  selectedModel === mod 
                                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {mod}
                              </button>
                            ))}
                            {part.compatibleModels.length > 3 && (
                              <span className="text-[10px] font-bold text-slate-400 self-center">
                                +{part.compatibleModels.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          <span className="text-lg font-black text-slate-900">
                            ₹{part.sellingPrice?.toLocaleString('en-IN')}
                          </span>
                          {part.originalPrice && part.originalPrice > part.sellingPrice && (
                            <span className="ml-2 text-xs font-semibold text-slate-400 line-through">
                              ₹{part.originalPrice?.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          OEM Spec
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/product/${part._id}`}
                          className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold text-center transition-colors"
                        >
                          Specs & Details
                        </Link>
                        
                        <button
                          disabled={part.stockQuantity <= 0 || addingId === part._id}
                          onClick={() => handleAddToCart(part, true)}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            part.stockQuantity <= 0
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : addingId === part._id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-amber-600 text-white shadow-sm'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{addingId === part._id ? 'Added!' : 'Add to Cart'}</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* 4. DIY REPLACEMENT & CARE GUIDE ACCORDION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600">
              Kitchen Appliance Maintenance Guide
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              Frequently Asked Questions About Appliance Spares
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Clear answers to help you maintain and repair your appliances at home.
            </p>
          </div>

          <div className="divide-y divide-slate-100 pt-4">
            
            <div className="py-4 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Why did my mixer grinder motor drive coupler break?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                The coupler teeth are deliberately engineered with high-impact polymer to act as a <strong>mechanical fuse</strong>. If hard spices or frozen ingredients accidentally jam the blade, the coupler breaks intentionally to prevent the 100% pure copper motor from overheating or burning out. Replacing the coupler takes only 60 seconds and saves the machine.
              </p>
            </div>

            <div className="py-4 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                How often should I replace jar rubber gaskets?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                For active Indian kitchens grinding daily, we recommend replacing the silicone lid gasket every <strong>6 to 12 months</strong>. Over time, high heat and turmeric spices harden the silicone, leading to minor juice leaks. A fresh gasket guarantees an airtight, spill-proof seal.
              </p>
            </div>

            <div className="py-4 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Are these parts genuine OEM factory replacements?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                Yes, 100%. All jars, razor blades, couplers, and silicone gaskets are manufactured from food-grade Stainless Steel 304 and certified BPA-free polymers. They are calibrated to exact factory motor shaft tolerances for safe, vibration-free operation.
              </p>
            </div>

            <div className="py-4 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                What if the part doesn't fit my machine?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                We back our compatibility engine with a <strong>7-Day Fitment Guarantee</strong>. If a part doesn’t fit your verified model number, we offer a free doorstep swap or full refund.
              </p>
            </div>

          </div>

          {/* Need Help Banner */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-900">Unsure about your model or part number?</h5>
                <p className="text-xs text-slate-500">Send a photo of your appliance label to our technical team.</p>
              </div>
            </div>
            <a
              href="https://wa.me/919876543210?text=Hi%20Kirti%20Store,%20I%20need%20help%20identifying%20a%20spare%20part%20for%20my%20appliance"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>WhatsApp Appliance Expert</span>
            </a>
          </div>

        </div>
      </section>

      {/* 5. MODEL NUMBER IDENTIFICATION MODAL */}
      <AnimatePresence>
        {showModelGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowModelGuide(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Where to Find Your Model Number</h4>
                  <p className="text-xs text-slate-500">Look for the silver or white certification rating label</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-800">1. Mixer Grinders & Food Processors:</p>
                  <p>Turn the appliance upside down. The model name (e.g. <em>Sujata MG-03</em> or <em>KRT-MX-750</em>) and wattage are printed on the underside base plate near the rubber suction feet.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-800">2. Blenders & Electric Kettles:</p>
                  <p>Check the bottom of the power base or on the rear motor housing near the power cable entry.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-800">3. Original Purchase Box & Invoice:</p>
                  <p>The model number is printed above the barcode on your user manual and tax invoice.</p>
                </div>
              </div>

              <button
                onClick={() => setShowModelGuide(false)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Got It, Let's Find My Spares
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SpareParts;
