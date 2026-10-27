import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, Sparkles, ArrowRight } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/common/LoadingSkeleton';

const Deals = () => {
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        // Fetch products and filter those with genuine originalPrice discount
        const res = await api.get('/products?limit=24');
        if (res.data.success) {
          const discounted = (res.data.products || []).filter(
            (p) => p.originalPrice && p.originalPrice > p.sellingPrice
          );
          setDealProducts(discounted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-zinc-950 via-primary to-zinc-900 border border-zinc-800 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-zinc-200 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-white" />
            <span>Limited Time Promotional Offers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black">
            Exclusive Deals on Premium Appliances
          </h1>
          <p className="text-sm text-slate-300">
            Enjoy up to 35% savings across our collection of heavy-duty mixer grinders, sparkling water makers, and blenders. Genuine discounts with full 2-year warranty.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">All Active Deals ({dealProducts.length})</h2>
          <span className="text-xs text-charcoal-light">Free Express Delivery applied</span>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : dealProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-surface-border">
            <p className="text-sm text-charcoal-light">No discounted deals active at this moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dealProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Deals;
