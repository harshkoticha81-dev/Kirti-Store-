import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Zap, 
  Award,
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Flame,
  PackagePlus
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/common/LoadingSkeleton';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/categories')
        ]);

        if (prodRes.data.success) {
          setFeaturedProducts(prodRes.data.products || []);
        }
        if (catRes.data.success) {
          setCategories(catRes.data.categories || []);
        }
      } catch (err) {
        console.error('[Home Data Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary via-primary to-zinc-900 text-white pt-12 pb-20 sm:pt-20 sm:pb-32">
        {/* Subtle decorative background glow circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-zinc-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text Column */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-zinc-200 text-xs font-bold tracking-wide">
                <Sparkles className="w-4 h-4 text-zinc-300" />
                <span>Next-Gen Engineering for Indian Culinary Homes</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Upgrade Your Kitchen.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                  Elevate Your Everyday.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Discover the precision of Kirti Store appliances. From ultra-powerful copper motor mixer grinders to whisper-quiet masticating juicers and instant home soda makers.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-black/25 hover:shadow-black/40 transition-all transform active:scale-95"
                >
                  <span>Shop Appliances</span>
                  <ArrowRight className="w-5 h-5 text-zinc-950" />
                </Link>

                <Link
                  to="/shop?isFeatured=true"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base border border-white/20 backdrop-blur-md transition-all flex items-center justify-center"
                >
                  Explore Bestsellers
                </Link>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-center lg:text-left">
                <div>
                  <p className="text-2xl font-black text-white">100%</p>
                  <p className="text-xs text-slate-400">Pure Copper Motors</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">2 Years</p>
                  <p className="text-xs text-slate-400">Complete Warranty</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">4.9 / 5</p>
                  <p className="text-xs text-slate-400">Verified Rating</p>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Image Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden border border-white/20 shadow-2xl shadow-black/50 group">
                <img
                  src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80"
                  alt="Modern Kitchen with Premium Kirti Appliances"
                  className="w-full h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              Product Categories
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-primary mt-1">
              Shop by Appliance Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="mt-3 md:mt-0 text-sm font-bold text-secondary hover:text-secondary-700 flex items-center gap-1 group"
          >
            <span>View All Products</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/shop?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-surface-border shadow-sm hover:shadow-premium transition-all duration-300 flex flex-col hover:-translate-y-1"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-surface-muted/40 relative">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <span className="absolute bottom-2.5 right-2.5 text-[11px] font-bold bg-white/90 backdrop-blur-md text-primary px-2.5 py-0.5 rounded-full shadow-sm">
                  {cat.productCount || 0} models
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h3 className="font-bold text-sm sm:text-base text-primary group-hover:text-secondary transition-colors leading-tight">
                  {cat.name}
                </h3>
                <span className="text-xs text-charcoal-light flex items-center gap-1 mt-2 font-medium">
                  Explore range <ChevronRight className="w-3 h-3 text-secondary group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED BESTSELLERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              Handpicked Appliances
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-primary mt-1">
              Featured Kitchen Bestsellers
            </h2>
          </div>
          <Link
            to="/shop?isFeatured=true"
            className="mt-3 md:mt-0 text-sm font-bold text-secondary hover:text-secondary-700 flex items-center gap-1 group"
          >
            <span>See All Bestsellers</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : featuredProducts.length === 0 ? (
          <div className="py-12 px-6 rounded-3xl bg-surface-muted/60 border border-surface-border text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-secondary flex items-center justify-center mx-auto">
              <PackagePlus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-primary">Catalog Ready for Your Appliances</h3>
            <p className="text-xs text-charcoal-light max-w-md mx-auto">
              All default products have been cleanly removed as requested. Add your custom branded kitchen appliances from the Admin Panel to feature them here!
            </p>
            <div className="pt-1">
              <Link
                to="/admin/products"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                <span>Add Appliance in Admin</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. PROMOTIONAL LIMITED-TIME OFFER BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-950 via-primary to-zinc-900 border border-zinc-800 text-white p-8 sm:p-12 shadow-2xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-zinc-200 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-zinc-300" />
                <span>Special Festive Kitchen Promotion</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Get up to 30% OFF on Soda Makers & Cold Press Juicers
              </h3>

              <p className="text-sm sm:text-base text-zinc-300 max-w-xl leading-relaxed">
                Transform healthy habits into delicious everyday rituals. Experience refreshing fizz on-demand and pulp-free nutrient dense cold juice with Kirti appliances.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/deals"
                  className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm shadow-lg shadow-black/20 transition-all transform active:scale-95"
                >
                  Claim Promotional Deal
                </Link>
                <Link
                  to="/shop?category=soda-makers"
                  className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm border border-zinc-700 transition-all"
                >
                  View Soda Makers
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center p-6 text-center shadow-inner">
                <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">Flat</span>
                <span className="text-5xl font-black text-white">30%</span>
                <span className="text-xs uppercase font-bold tracking-wider text-zinc-300">Discount Applied</span>
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* 6. WHY CHOOSE KIRTI STORE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-secondary">
            Engineered for Longevity
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-primary mt-1">
            Why Choose Kirti Store?
          </h2>
          <p className="text-sm text-charcoal-light mt-2">
            Every appliance is tested under rigorous real-world kitchen environments before it arrives at your doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-secondary flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-primary">Heavy Copper Motors</h4>
            <p className="text-xs text-charcoal-light leading-relaxed">
              Equipped with high-grade copper windings and thermal overload cutoff for enduring daily grinding without overheating.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-primary">Direct Factory Warranty</h4>
            <p className="text-xs text-charcoal-light leading-relaxed">
              Up to 2 years full comprehensive warranty and 5 years motor protection supported by certified technicians nationwide.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-primary">Prompt Delivery & Care</h4>
            <p className="text-xs text-charcoal-light leading-relaxed">
              Reliable door-to-door dispatch with tracking across all pin codes, and free transit insurance on all orders.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-primary">Transparent Pricing</h4>
            <p className="text-xs text-charcoal-light leading-relaxed">
              No hidden fees, no fictitious markups. Genuine MRPs with transparent prices backed by our 7-day easy return policy.
            </p>
          </div>
        </div>
      </section>



    </div>
  );
};

export default Home;
