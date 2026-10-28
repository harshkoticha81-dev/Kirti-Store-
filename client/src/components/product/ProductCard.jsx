import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Eye, ArrowLeftRight, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { isBigAppliance } from '../../utils/shippingCalculator';
import { getSafeProductImageUrl, getApplianceFallbackImage } from '../../utils/imageUtils';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toggleCompare, isInCompare } = useCompare();

  const isFavorite = isInWishlist(product._id);
  const isCompared = isInCompare(product._id || product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = !isOutOfStock && product.stockQuantity <= (product.lowStockThreshold || 5);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.sellingPrice
      ? Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100)
      : null;

  return (
    <div className="group relative bg-white rounded-2xl border border-surface-border overflow-hidden shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-muted/30">
        <Link to={`/product/${product.slug || product._id}`}>
          <img
            src={getSafeProductImageUrl(product.images?.[0], product.categoryName || product.name)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getApplianceFallbackImage(product.categoryName || product.name);
            }}
          />
        </Link>

        {/* Badges: Discount & Stock */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {discountPercent && (
            <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider bg-accent text-white rounded-lg shadow-sm">
              {discountPercent}% OFF
            </span>
          )}

          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 text-white rounded-lg shadow-sm">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 text-white rounded-lg shadow-sm">
              Only {product.stockQuantity} Left!
            </span>
          ) : null}
        </div>

        {/* Action Buttons Top Right: Wishlist & Compare */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product);
            }}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
              isFavorite
                ? 'bg-rose-50 text-rose-500'
                : 'bg-white/80 hover:bg-white text-charcoal hover:text-rose-500'
            }`}
            title={isFavorite ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleCompare(product);
            }}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
              isCompared
                ? 'bg-secondary text-white'
                : 'bg-white/80 hover:bg-white text-charcoal hover:text-secondary'
            }`}
            title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick View Overlay on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex gap-2">
          <Link
            to={`/product/${product.slug || product._id}`}
            className="flex-1 py-2 px-3 bg-white/90 backdrop-blur-md text-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-white shadow"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleCompare(product);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 backdrop-blur-md transition-colors shadow ${
              isCompared ? 'bg-secondary text-white' : 'bg-white/90 text-primary hover:bg-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{isCompared ? 'Comparing' : 'Compare'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Appliance Package Size Badge */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-light truncate">
              {product.categoryName || 'Kitchen Appliance'}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0 ${
              isBigAppliance(product)
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}>
              <span>📦</span>
              <span>{isBigAppliance(product) ? '₹120 Trans.' : '₹60 Trans.'}</span>
            </span>
          </div>

          {/* Product Name */}
          <Link to={`/product/${product.slug || product._id}`}>
            <h3 className="text-sm sm:text-base font-bold text-primary hover:text-secondary transition-colors line-clamp-2 mt-1 mb-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-charcoal">
              {product.rating > 0 ? product.rating.toFixed(1) : 'New'}
            </span>
            {product.numReviews > 0 && (
              <span className="text-[11px] text-charcoal-light">
                ({product.numReviews})
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Button */}
        <div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-lg sm:text-xl font-black text-primary">
              ₹{product.sellingPrice?.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.sellingPrice && (
              <span className="text-xs font-medium text-charcoal-light line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => addToCart(product, 1)}
              disabled={isOutOfStock}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-primary hover:bg-secondary text-white shadow-sm hover:shadow active:scale-95'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
