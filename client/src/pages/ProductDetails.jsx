import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  CheckCircle2, 
  Minus, 
  Plus, 
  Share2, 
  Award,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  ArrowLeftRight
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/product/ProductCard';
import PincodeChecker from '../components/product/PincodeChecker';
import ProductQA from '../components/product/ProductQA';
import { isBigAppliance } from '../utils/shippingCalculator';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toggleCompare, isInCompare } = useCompare();
  const { isAuthenticated, user } = useAuth();
  const { success, error: showError } = useToast();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.product);
          setRelatedProducts(res.data.relatedProducts || []);
          setSelectedImage(0);
          setQuantity(1);

          // Fetch reviews
          const reviewRes = await api.get(`/products/${res.data.product._id}/reviews`);
          if (reviewRes.data.success) {
            setReviews(reviewRes.data.reviews || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-primary mb-4">Product Not Found</h2>
        <p className="text-charcoal-light mb-6">The appliance you are searching for might be removed or discontinued.</p>
        <Link to="/shop" className="px-6 py-2.5 bg-secondary text-white font-bold rounded-full">
          Browse Catalog
        </Link>
      </div>
    );
  }

  const isFavorite = isInWishlist(product._id);
  const isCompared = isInCompare(product._id || product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = !isOutOfStock && product.stockQuantity <= (product.lowStockThreshold || 5);
  const maxAvailable = product.stockQuantity;

  const discountPercent =
    product.originalPrice && product.originalPrice > product.sellingPrice
      ? Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100)
      : null;

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxAvailable) {
        showError(`Maximum units in stock: ${maxAvailable}`);
        return prev;
      }
      return next;
    });
  };

  const handleBuyNow = async () => {
    const added = await addToCart(product, quantity);
    if (added) {
      navigate('/checkout');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showError('Please sign in to leave a verified review.');
      navigate('/login');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post(`/products/${product._id}/reviews`, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });

      if (res.data.success) {
        success('Review posted successfully!');
        setReviews([res.data.review, ...reviews]);
        setReviewComment('');
        setReviewTitle('');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-charcoal-light">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/shop" className="hover:text-primary">Appliances</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/shop?category=${product.category?.slug}`} className="hover:text-primary">
          {product.categoryName}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image */}
          <div className="aspect-square w-full rounded-3xl bg-white border border-surface-border overflow-hidden relative shadow-premium">
            <img
              src={product.images?.[selectedImage] || product.images?.[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {discountPercent && (
              <span className="absolute top-4 left-4 px-3 py-1.5 bg-accent text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md">
                Save {discountPercent}%
              </span>
            )}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => toggleWishlist(product)}
                className="p-3 rounded-full bg-white/90 backdrop-blur-md shadow-md text-charcoal hover:text-rose-500 transition-colors"
                title={isFavorite ? 'Remove from Wishlist' : 'Save to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current text-rose-500' : ''}`} />
              </button>

              <button
                onClick={() => toggleCompare(product)}
                className={`p-3 rounded-full backdrop-blur-md shadow-md transition-colors ${
                  isCompared
                    ? 'bg-secondary text-white'
                    : 'bg-white/90 text-charcoal hover:text-secondary'
                }`}
                title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white ${
                    selectedImage === idx ? 'border-secondary shadow-md scale-95' : 'border-surface-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="lg:col-span-6 space-y-6">
          
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                {product.brand || 'Kirti'} • {product.categoryName}
              </span>
              <span className="text-xs font-mono font-medium text-charcoal-light">
                SKU: {product.SKU}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-primary leading-tight">
              {product.name}
            </h1>

            {/* Rating summary */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-sm font-bold text-charcoal">
                {product.rating > 0 ? product.rating.toFixed(1) : 'New'} / 5.0
              </span>
              <span className="text-xs text-charcoal-light">
                ({product.numReviews} Verified Reviews)
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-5 rounded-2xl bg-white border border-surface-border shadow-sm flex items-baseline gap-4">
            <span className="text-3xl font-black text-primary">
              ₹{product.sellingPrice?.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.sellingPrice && (
              <>
                <span className="text-base text-charcoal-light line-through font-medium">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  You Save ₹{(product.originalPrice - product.sellingPrice).toLocaleString('en-IN')}
                </span>
              </>
            )}
          </div>

          {/* Short Description */}
          <p className="text-sm text-charcoal-light leading-relaxed">
            {product.shortDescription || product.description?.substring(0, 200)}
          </p>

          {/* Stock Availability indicator */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Currently Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Hurry, only {product.stockQuantity} units left in stock!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                In Stock & Ready to Dispatch
              </span>
            )}
          </div>

          {/* Quantity Selector & Action CTAs */}
          <div className="space-y-4 pt-2">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center border border-surface-border rounded-xl bg-white shadow-sm overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2.5 text-charcoal hover:bg-surface-muted disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 font-bold text-sm text-primary">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxAvailable}
                    className="p-2.5 text-charcoal hover:bg-surface-muted disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => addToCart(product, quantity)}
                disabled={isOutOfStock}
                className="flex-1 py-4 px-6 rounded-2xl bg-primary hover:bg-primary-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
              </button>

              {!isOutOfStock && (
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-4 px-6 rounded-2xl border-2 border-primary hover:bg-zinc-100 text-primary font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <span>Buy Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Delivery & Warranty Trust Signals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-surface-border">
            <div className="p-3 rounded-xl bg-white border border-surface-border flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-secondary flex-shrink-0" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold text-primary">
                  {isBigAppliance(product) ? '₹120 Transportation' : '₹60 Transportation'}
                </p>
                <p className="text-charcoal-light">
                  {isBigAppliance(product) ? 'Big Appliance Package' : 'Small Appliance Package'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-surface-border flex items-center gap-2.5">
              <Award className="w-5 h-5 text-accent flex-shrink-0" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold text-primary">{product.warranty || '2 Years Warranty'}</p>
                <p className="text-charcoal-light">Certified service</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-surface-border flex items-center gap-2.5">
              <RefreshCw className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold text-primary">7-Day Easy Returns</p>
                <p className="text-charcoal-light">Hassle-free swap</p>
              </div>
            </div>
          </div>

          {/* Delivery Pincode Checker */}
          <PincodeChecker sellingPrice={product.sellingPrice} />

        </div>

      </div>

      {/* Specifications & Detailed Overview */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-10 shadow-sm space-y-8">
        <div>
          <h2 className="text-xl font-bold text-primary mb-3">Product Description</h2>
          <p className="text-sm sm:text-base text-charcoal-light leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Specifications Table */}
        {product.specifications?.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 border-t border-surface-border pt-4">
              {product.specifications.map((spec, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-surface-border text-xs sm:text-sm">
                  <span className="font-semibold text-charcoal-light">{spec.key}</span>
                  <span className="font-bold text-primary">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>



      {/* Product Customer Q&A Section */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-10 shadow-sm">
        <ProductQA productName={product.name} />
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-10 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-primary">Customer Reviews</h2>
            <p className="text-xs text-charcoal-light mt-0.5">Verified buyers and home culinary reviews</p>
          </div>
          <span className="px-4 py-2 bg-surface-muted rounded-full text-xs font-bold text-primary">
            {reviews.length} Verified Submissions
          </span>
        </div>

        {/* Write a review form */}
        <form onSubmit={handleReviewSubmit} className="p-5 rounded-2xl bg-surface-bg border border-surface-border space-y-4">
          <h4 className="text-sm font-bold text-primary flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-secondary" />
            Write a Review
          </h4>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-charcoal">Your Rating:</span>
            <div className="flex gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-0.5 focus:outline-none"
                >
                  <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-current' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Headline (e.g. Excellent blending speed!)"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white border border-surface-border text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          <textarea
            rows="3"
            placeholder="Share your practical experience with this appliance..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-surface-border text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-secondary"
          />

          <button
            type="submit"
            disabled={submittingReview}
            className="px-6 py-2.5 bg-secondary hover:bg-secondary-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            {submittingReview ? 'Submitting...' : 'Post Customer Review'}
          </button>
        </form>

        {/* Existing Reviews List */}
        <div className="space-y-4 divide-y divide-surface-border">
          {reviews.length === 0 ? (
            <p className="text-xs text-charcoal-light text-center py-6">
              Be the first to review the {product.name}!
            </p>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="pt-4 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary">{rev.userName}</span>
                    {rev.verifiedPurchase && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-charcoal-light">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex text-amber-400 gap-0.5">
                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                {rev.title && <h5 className="text-xs font-bold text-primary">{rev.title}</h5>}
                <p className="text-xs sm:text-sm text-charcoal-light leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts?.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-primary">Related Appliances</h2>
            <Link to={`/shop?category=${product.category?.slug}`} className="text-sm font-bold text-secondary">
              Explore More
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetails;
