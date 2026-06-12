import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import ImageGallery from './ImageGallery';
import ReviewSection from './ReviewSection';
import ProductCard from '../../components/Reusable/ProductCard';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Loader from '../../components/Reusable/Loader';
import Button from '../../components/Reusable/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/Reusable/Toast';
import { Star, Heart, ShoppingBag, Plus, Minus, ShieldCheck, ChevronRight, Truck, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const fetchProductDetails = useCallback(async () => {
    try {
      const data = await productService.getProductById(id);
      setProduct(data);
      
      if (data) {
        const related = await productService.getRelatedProducts(data.category, data.id, 4);
        setRelatedProducts(related);
      }
    } catch (err) {
      setError(err.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    fetchProductDetails();
  }, [id, fetchProductDetails]);

  const handleQtyChange = (type) => {
    if (type === 'inc') {
      setQuantity(q => Math.min(q + 1, product.stock));
    } else {
      setQuantity(q => Math.max(q - 1, 1));
    }
  };

  const handleAddToCart = async () => {
    setCartLoading(true);
    try {
      await addToCart(product, quantity);
      showToast('Added to cart', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product, quantity);
      navigate('/cart');
    } catch (err) {
      showToast('Checkout routing failed', 'error');
    }
  };

  const handleWishlistToggle = async () => {
    const isFav = isInWishlist(product.id);
    try {
      if (isFav) {
        await removeFromWishlist(product.id);
        showToast('Removed from wishlist', 'info');
      } else {
        await addToWishlist(product);
        showToast('Added to wishlist', 'success');
      }
    } catch (err) {
      showToast('Error updating wishlist', 'error');
    }
  };

  if (loading) return <Loader fullScreen text="Loading product details..." />;
  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50 dark:bg-slate-950">
        <AlertCircle className="text-red-500 h-12 w-12 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Error loading product details</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">{error || 'Unknown error occurred.'}</p>
        <Button onClick={() => navigate('/products')}>Browse Products</Button>
      </div>
    );
  }

  const originalPrice = product.original_price ?? product.price;
  const offerPrice = product.offer_price;
  const offer = product.offers || product.offer;
  const isOfferActive = !!(offerPrice && offer && offer.is_active);
  const isFavorite = product ? isInWishlist(product.id) : false;
  
  const savingsPercent = isOfferActive && offer.discount_percent
    ? offer.discount_percent
    : originalPrice && offerPrice
      ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 min-h-screen">
      
      {/* ── Breadcrumbs ── */}
      <div className="mb-6 flex items-center space-x-2 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
         <Link to="/" className="hover:text-[#ff2a85] transition-colors">Home</Link>
         <ChevronRight size={12} className="shrink-0" />
         <Link to="/products" className="hover:text-[#ff2a85] transition-colors">Collections</Link>
         <ChevronRight size={12} className="shrink-0" />
         <span className="text-slate-600 dark:text-slate-350 truncate">{product.name}</span>
      </div>

      {/* ── Premium Details Card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/5 rounded-3xl p-4 sm:p-8 lg:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        
        {/* Left Column: Image Viewport */}
        <div>
          <ImageGallery images={product.images} />
        </div>

        {/* Right Column: Information details */}
        <div className="flex flex-col space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-950/20 text-[#ff2a85] text-[10px] font-black uppercase tracking-widest rounded-full leading-none">
              <Sparkles size={10} />
              {product.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight" style={{ fontFamily: "'TT Drugs', sans-serif" }}>
              {product.name}
            </h1>
            
            {/* Rating Stars Summary */}
            <div className="flex items-center space-x-2 pt-1">
              <div className="flex text-amber-400">
                <Star size={15} fill="currentColor" />
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                {product.rating || '0.0'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-xs text-slate-550 dark:text-slate-400 font-bold hover:text-[#ff2a85] cursor-pointer transition">
                {product.review_count || 0} Customer reviews
              </span>
            </div>
          </div>

          {/* Premium Pricing Card */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/60 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Pricing Model</span>
              <div className="flex items-baseline gap-2.5">
                {isOfferActive ? (
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-[#ff2a85] dark:text-[#ff2a85] tracking-tight">
                        {formatCurrency(offerPrice)}
                      </span>
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        {formatCurrency(originalPrice)}
                      </span>
                    </div>
                    {savingsPercent && (
                      <span className="inline-flex mt-2 text-[10px] font-black text-[#ff2a85] bg-[#ff2a85]/10 px-2.5 py-1 rounded-lg w-fit uppercase tracking-wider">
                        🏷️ Special campaign: {offer.message} ({savingsPercent}% OFF)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Stock details */}
            <div className="sm:text-right flex flex-col items-start sm:items-end justify-center">
              <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">Availability</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                product.stock > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
              }`}>
                {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Interactive Specifications / Details Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 text-sm font-bold overflow-x-auto scrollbar-none whitespace-nowrap">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-[#ff2a85] text-[#ff2a85]'
                  : 'border-transparent text-slate-450 hover:text-[#ff2a85] dark:hover:text-[#ff2a85]'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'specs'
                  ? 'border-[#ff2a85] text-[#ff2a85]'
                  : 'border-transparent text-slate-450 hover:text-[#ff2a85] dark:hover:text-[#ff2a85]'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'shipping'
                  ? 'border-[#ff2a85] text-[#ff2a85]'
                  : 'border-transparent text-slate-450 hover:text-[#ff2a85] dark:hover:text-[#ff2a85]'
              }`}
            >
              Shipping & Policy
            </button>
          </div>

          {/* Tabs Content Area */}
          <div className="min-h-[100px] text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
            {activeTab === 'description' && (
              <p>{product.description || 'No detailed product description has been configured for this listing yet.'}</p>
            )}

            {activeTab === 'specs' && (
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                <li>Material: Hypoallergenic Premium Jewelry Metal Alloy</li>
                <li>Design category: {product.category}</li>
                <li>Fine diamond and stone cuts for ultimate shine</li>
                <li>Comes in premium signature Soshka presentation box</li>
                <li>Certificate of authenticity included</li>
              </ul>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                  <Truck size={18} className="text-[#ff2a85] shrink-0" />
                  <div>
                    <h5 className="font-black text-xs uppercase tracking-wide">Free Shipping</h5>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Free standard shipping on orders above ₹999. Usually delivers in 3-5 business days.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                  <RefreshCw size={18} className="text-[#ff2a85] shrink-0" />
                  <div>
                    <h5 className="font-black text-xs uppercase tracking-wide">14-Day Easy Returns</h5>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">We accept returns within 14 days of delivery. Must be unworn and in original box.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quantity Selection & Action Buttons */}
          {product.stock > 0 ? (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Quantity</span>
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                    <button
                      onClick={() => handleQtyChange('dec')}
                      className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-4 text-sm font-black text-slate-800 dark:text-white select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQtyChange('inc')}
                      className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                
                {/* Wishlist Icon Action */}
                <button
                  onClick={handleWishlistToggle}
                  className="p-3 border border-slate-250 dark:border-slate-700 rounded-xl text-slate-550 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:scale-105 active:scale-95 transition bg-white dark:bg-slate-850 shadow-sm"
                  title="Toggle wishlist item"
                >
                  <Heart size={18} fill={isFavorite ? '#ff2a85' : 'none'} className={isFavorite ? 'text-[#ff2a85]' : ''} />
                </button>
              </div>

              {/* Purchase triggers */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleAddToCart}
                  className="flex-grow font-extrabold py-3 border-none bg-gradient-to-r from-primary-600 to-pink-600 hover:from-primary-700 hover:to-pink-700 transition hover:scale-[1.01] duration-200"
                  loading={cartLoading}
                  disabled={cartLoading}
                  icon={ShoppingBag}
                >
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  variant="secondary"
                  className="flex-grow font-extrabold py-3 border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-550 dark:bg-slate-800 dark:hover:bg-slate-750 hover:scale-[1.01] transition duration-200"
                >
                  Buy Now
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-150 dark:border-slate-800">
              <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center space-x-3 text-red-500 text-sm font-semibold">
                <AlertCircle size={20} className="shrink-0" />
                <span>This product is currently out of stock. Please check back later or add to wishlist.</span>
              </div>
            </div>
          )}

          {/* Secure Purchase guarantee indicator */}
          <div className="flex items-center space-x-2 pt-2 text-xs font-semibold text-slate-450">
            <ShieldCheck size={16} className="text-primary-600" />
            <span>Secure Checkout with Razorpay • 100% Buyer Protection Guarantee</span>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection
        productId={product.id}
        onReviewSubmitted={fetchProductDetails}
      />

      {/* Related Products list showcase */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800">
          <SectionTitle
            title="Related Products"
            subtitle="Explore other popular items from this exact category."
            align="left"
          />
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
