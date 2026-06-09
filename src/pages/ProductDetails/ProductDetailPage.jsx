import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Star, Heart, ShoppingBag, Plus, Minus, ShieldCheck } from 'lucide-react';

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

  const fetchProductDetails = useCallback(async () => {
    try {
      const data = await productService.getProductById(id);
      setProduct(data);
      
      // Fetch related products from same category
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-red-500 mb-4">Error loading product details</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Unknown error occurred.'}</p>
        <Button onClick={() => navigate('/products')}>Browse Products</Button>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        
        {/* Left image column */}
        <ImageGallery images={product.images} />

        {/* Right content column */}
        <div className="flex flex-col space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2 block">
              {product.category}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans leading-tight">
              {product.name}
            </h1>
            
            {/* Rating summary */}
            <div className="flex items-center space-x-2 mt-3.5">
              <div className="flex text-amber-400">
                <Star size={16} fill="currentColor" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-350">
                {product.rating || '0.0'}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                ({product.review_count || 0} customer reviews)
              </span>
            </div>
          </div>

          {/* Price details */}
          <div className="p-4 bg-slate-100 dark:bg-slate-850 rounded-2xl flex items-center justify-between border border-slate-200/50 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Price</p>
              <div className="flex items-baseline space-x-2">
                {hasDiscount ? (
                  <>
                    <span className="text-2xl font-black text-slate-905 dark:text-white">
                      {formatCurrency(product.discount_price)}
                    </span>
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      {formatCurrency(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Stock indicator */}
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                product.stock > 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400'
              }`}>
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Description text */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Description</h4>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350 font-medium">
              {product.description || 'No product description has been configured for this listing yet.'}
            </p>
          </div>

          {/* Quantity selection & Actions */}
          {product.stock > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450">Quantity</span>
                <div className="flex items-center space-x-1 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                  <button
                    onClick={() => handleQtyChange('dec')}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 text-sm font-bold text-slate-800 dark:text-white select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQtyChange('inc')}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 min-w-[150px]"
                  loading={cartLoading}
                  disabled={cartLoading}
                  icon={ShoppingBag}
                >
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  variant="secondary"
                  className="flex-1 min-w-[150px]"
                >
                  Buy Now
                </Button>
                <button
                  onClick={handleWishlistToggle}
                  className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:scale-103 transition bg-white dark:bg-slate-800 shadow-sm"
                >
                  <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-red-500' : ''} />
                </button>
              </div>
            </div>
          )}

          {/* Secure Purchase guarantee */}
          <div className="flex items-center space-x-2 pt-4 text-xs font-semibold text-slate-450">
            <ShieldCheck size={16} className="text-primary-600" />
            <span>Secure transactional checkout. 100% buyer protection guarantee.</span>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection
        productId={product.id}
        onReviewSubmitted={fetchProductDetails}
      />

      {/* Related Products list */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800">
          {/* Required SectionTitle */}
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
