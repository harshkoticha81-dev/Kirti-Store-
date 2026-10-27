import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const Wishlist = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-white border border-surface-border shadow-sm flex items-center justify-center mx-auto mb-6 text-charcoal-light">
          <Heart className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-primary mb-2">Your Wishlist is Empty</h1>
        <p className="text-xs text-charcoal-light max-w-sm mx-auto mb-6">
          Save your favourite blenders, mixers, and kitchen appliances to review them anytime.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-white font-bold text-xs shadow transition-colors"
        >
          <span>Explore Appliances</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-primary">Saved Appliances ({wishlist.length})</h1>
        <p className="text-xs text-charcoal-light mt-1">Review your saved appliances and easily add them to your cart.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => {
          const isOutOfStock = product.stockQuantity <= 0;
          return (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-surface-border overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="relative aspect-square overflow-hidden bg-surface-muted/30">
                <Link to={`/product/${product.slug || product._id}`}>
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow text-rose-500 hover:bg-white"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-light">
                    {product.categoryName}
                  </span>
                  <Link to={`/product/${product.slug || product._id}`}>
                    <h3 className="font-bold text-sm text-primary line-clamp-2 hover:text-secondary mt-0.5">
                      {product.name}
                    </h3>
                  </Link>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-black text-base text-primary">
                    ₹{product.sellingPrice?.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-charcoal-light line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => addToCart(product, 1)}
                  disabled={isOutOfStock}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-secondary disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Out of Stock' : 'Move to Cart'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
