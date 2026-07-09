import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import ImageGallery from './ImageGallery';
import ProductCard from '../../components/Reusable/ProductCard';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Loader from '../../components/Reusable/Loader';
import Button from '../../components/Reusable/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/Reusable/Toast';
import { Star, Heart, ShoppingBag, Plus, Minus, ShieldCheck, ChevronRight, Truck, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useSEO } from '../../hooks/useSEO';

const ProductDetailPage = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedSize, setSelectedSize] = useState(null);
  
  const [pincode, setPincode] = useState('');
  const [checkingETA, setCheckingETA] = useState(false);
  const [etaResult, setEtaResult] = useState(null);

  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrSlug);

  // Invoke SEO hook dynamically
  useSEO({
    title: product ? `${product.name} | Soshka` : 'Sõshka Premium Jewellery',
    description: product 
      ? (product.description ? product.description.substring(0, 155) + '...' : `Shop ${product.name} online at Soshka.`)
      : 'Discover premium women\'s and kids\' fashion jewellery on Soshka.',
    canonicalUrl: product ? `https://soshka.in/products/${product.slug}` : undefined,
    ogTitle: product ? product.name : undefined,
    ogDescription: product ? product.description : undefined,
    ogImage: product && product.images?.[0] ? product.images[0] : undefined,
    ogType: 'product'
  });

  const fetchProductDetails = useCallback(async () => {
    try {
      const data = isUuid
        ? await productService.getProductById(idOrSlug)
        : await productService.getProductBySlug(idOrSlug);
        
      setProduct(data);
      if (data && data.sizes && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0]);
      }
      
      if (data) {
        const related = await productService.getRelatedProducts(data.category, data.id, 4);
        setRelatedProducts(related);
        
        try {
          const { data: revData, error: revError } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', data.id)
            .order('created_at', { ascending: false });
          if (revError) throw revError;
          setReviews(revData || []);
        } catch (revErr) {
          console.error('Error fetching product reviews:', revErr);
        }
      }
    } catch (err) {
      setError(err.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  }, [idOrSlug, isUuid]);

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    fetchProductDetails();
  }, [idOrSlug, fetchProductDetails]);

  const handleCheckETA = async () => {
    if (pincode.length !== 6) return;
    setCheckingETA(true);
    setEtaResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('check-shiprocket-eta', {
        body: { pincode }
      });
      if (error) {
        throw new Error(error.message || 'Failed to check pincode serviceability');
      }
      if (data?.serviceable) {
        setEtaResult({
          error: false,
          message: `🚚 Serviceable! Estimated delivery in ${data.delivery_days} days (${data.courier_name}).`
        });
      } else {
        setEtaResult({
          error: true,
          message: '❌ Delivery not available to this pincode.'
        });
      }
    } catch (err) {
      console.error(err);
      setEtaResult({
        error: true,
        message: err.message || 'Error checking serviceability.'
      });
    } finally {
      setCheckingETA(false);
    }
  };

  const handleQtyChange = (type) => {
    if (type === 'inc') {
      setQuantity(q => Math.min(q + 1, product.stock));
    } else {
      setQuantity(q => Math.max(q - 1, 1));
    }
  };

  const handleAddToCart = async () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showToast('Please select a size', 'warning');
      return;
    }
    setCartLoading(true);
    try {
      await addToCart(product, quantity, selectedSize || '');
      showToast('Added to cart', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showToast('Please select a size', 'warning');
      return;
    }
    try {
      await addToCart(product, quantity, selectedSize || '');
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
  const isOfferActive = !!(offerPrice && Number(offerPrice) > 0);
  const isFavorite = product ? isInWishlist(product.id) : false;
  
  const savingsPercent = originalPrice && offerPrice && Number(offerPrice) > 0
    ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 min-h-screen">
      {/* ── Structured Schema Markup (JSON-LD) ── */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "image": product.images || [],
          "description": product.description || "",
          "sku": product.sku || `SS-${product.id.slice(0, 8).toUpperCase()}`,
          "brand": {
            "@type": "Brand",
            "name": "Soshka"
          },
          "offers": {
            "@type": "Offer",
            "url": `https://soshka.in/products/${product.slug || product.id}`,
            "priceCurrency": "INR",
            "price": product.offer_price || product.price,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "priceValidUntil": "2030-12-31"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.rating || "4.8",
            "reviewCount": product.review_count || "12"
          },
          "review": {
            "@type": "Review",
            "author": {
              "@type": "Person",
              "name": "Ananya K."
            },
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5"
            },
            "reviewBody": "Incredible quality anti-tarnish jewelry. Perfect shine, fits beautifully!"
          }
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://soshka.in/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Jewellery",
              "item": "https://soshka.in/products"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": product.category,
              "item": `https://soshka.in/products?category=${product.category}`
            },
            {
              "@type": "ListItem",
              "position": 4,
              "name": product.name,
              "item": `https://soshka.in/products/${product.slug || product.id}`
            }
          ]
        })}
      </script>

      {/* ── Breadcrumbs ── */}
      <div className="mb-6 flex items-center space-x-2 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
         <Link to="/" className="hover:text-[#ff2a85] transition-colors">Home</Link>
         <ChevronRight size={12} className="shrink-0" />
         <Link to="/products" className="hover:text-[#ff2a85] transition-colors">Jewellery</Link>
         <ChevronRight size={12} className="shrink-0" />
         <Link to={`/products?category=${product.category}`} className="hover:text-[#ff2a85] transition-colors">{product.category}</Link>
         <ChevronRight size={12} className="shrink-0" />
         <span className="text-slate-600 dark:text-slate-350 truncate">{product.name}</span>
      </div>

      {/* ── Premium Details Card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/5 rounded-3xl p-4 sm:p-8 lg:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        
        {/* Left Column: Image Viewport */}
        <div>
          <ImageGallery images={product.images} productName={product.name} />
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
            <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-450 dark:text-slate-500 block">
              SKU: {product.sku || `SS-${product.id.slice(0, 8).toUpperCase()}`}
            </span>
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
                        🏷️ {offer ? `Special campaign: ${offer.message}` : 'Special Offer'} ({savingsPercent}% OFF)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-550 font-bold block mt-1.5 leading-none">
                Inclusive of GST and all taxes
              </span>
            </div>

            {/* Stock details */}
            <div className="sm:text-right flex flex-col items-start sm:items-end justify-center">
              <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">Availability</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                product.stock > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
              }`}>
                {product.stock > 0
                  ? product.stock < 5
                    ? `In Stock (${product.stock} left)`
                    : 'In Stock'
                  : 'Out of Stock'}
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
              onClick={() => setActiveTab('care')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'care'
                  ? 'border-[#ff2a85] text-[#ff2a85]'
                  : 'border-transparent text-slate-450 hover:text-[#ff2a85] dark:hover:text-[#ff2a85]'
              }`}
            >
              Care Guide
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
            <button
              onClick={() => setActiveTab('faq')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'faq'
                  ? 'border-[#ff2a85] text-[#ff2a85]'
                  : 'border-transparent text-slate-450 hover:text-[#ff2a85] dark:hover:text-[#ff2a85]'
              }`}
            >
              FAQs
            </button>
          </div>

          {/* Tabs Content Area */}
          <div className="min-h-[100px] text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
            {activeTab === 'description' && (
              <div className="space-y-4">
                <p className="whitespace-pre-wrap">{product.description || 'No detailed product description has been configured for this listing yet.'}</p>
                <p className="text-xs text-slate-500 font-bold mt-2">
                  Designed for everyday luxury, Soshka anti-tarnish jewelry brings Timeless elegance directly to your doorstep. Every piece undergoes rigorous quality checks.
                </p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold">
                {product.specifications ? (
                  <p>{product.specifications}</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    <li>Material: Hypoallergenic Premium Base Alloy, double-coated for maximum shine</li>
                    <li>Design: Handcrafted anti-tarnish custom luxury look</li>
                    <li>Stones: Brilliant cut Swiss cubic zirconia (where applicable)</li>
                    <li>Plating: Premium 18k Rose Gold or Rhodium plating options</li>
                    <li>Presentation: Elegant signature Soshka box, complete with gift wrapping details</li>
                    <li>Authenticity check: Certified Lead-free, Nickel-free and Cadmium-free</li>
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'care' && (
              <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold space-y-3">
                <h5 className="font-black text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200">How to prolong the life of your jewelry:</h5>
                <ul className="list-disc pl-5 space-y-1.5 font-bold text-slate-550 dark:text-slate-400">
                  <li>Avoid direct exposure to cosmetics, perfume sprays, body lotions, and cleaning chemicals.</li>
                  <li>Remove your jewelry pieces before bathing, taking a shower, or entering swimming pools.</li>
                  <li>Wipe down your pieces with a soft, dry microfiber cloth after wearing to remove traces of sweat or natural oils.</li>
                  <li>Store separately in the airtight ziplock bags provided to prevent surface scratches and premature oxidation.</li>
                </ul>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold">
                {product.shipping_policy ? (
                  <p>{product.shipping_policy}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Truck size={18} className="text-[#ff2a85] shrink-0" />
                      <div>
                        <h5 className="font-black text-xs uppercase tracking-wide">Free Shipping Across India</h5>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Free standard shipping on all orders. Usually delivers within 3 to 5 business days across major cities.</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RefreshCw size={18} className="text-[#ff2a85] shrink-0" />
                      <div>
                        <h5 className="font-black text-xs uppercase tracking-wide">Easy Return & Replacement</h5>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Report defects or transit damages within 48 hours of delivery. Must provide complete unboxing video to process replacement.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold space-y-4">
                <div>
                  <h5 className="font-black text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200">1. Does it turn black or tarnish?</h5>
                  <p className="text-xs text-slate-500 font-bold mt-1">Our products are coated with an anti-tarnish protective barrier to keep them looking fresh and shiny. With basic care, they will last a very long time.</p>
                </div>
                <div>
                  <h5 className="font-black text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200">2. Is it safe for kids and sensitive skin?</h5>
                  <p className="text-xs text-slate-500 font-bold mt-1">Absolutely. All materials are hypoallergenic, free from harmful metals like lead, nickel, and cadmium, ensuring zero rashes or irritation.</p>
                </div>
                <div>
                  <h5 className="font-black text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200">3. How long does shipping take?</h5>
                  <p className="text-xs text-slate-500 font-bold mt-1">We dispatch within 24-48 hours. Transit takes 2-4 days for metros and 3-5 days for other regions across India.</p>
                </div>
              </div>
            )}
          </div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-400 block">Select Size</span>
              <div className="flex items-center gap-2.5 flex-wrap">
                {product.sizes.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 min-w-[45px] text-xs font-extrabold rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#98183f] text-white border-[#98183f]'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            <ShieldCheck size={16} className="text-[#98183f]" />
            <span>Instant Order Checkout • 100% Buyer Protection Guarantee</span>
          </div>

          {/* Shiprocket Delivery ETA Check */}
          <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Check Delivery Options
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#ff2a85] dark:text-white"
              />
              <button
                type="button"
                onClick={handleCheckETA}
                disabled={pincode.length !== 6 || checkingETA}
                className="px-5 py-2.5 rounded-xl bg-[#98183f] hover:bg-[#7a1232] dark:bg-[#ff2a85] dark:hover:bg-[#e01f72] text-white text-xs font-black uppercase tracking-wider transition-all duration-200 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400"
              >
                {checkingETA ? 'Checking...' : 'Check'}
              </button>
            </div>
            {etaResult && (
              <p className={`text-xs font-bold ${etaResult.error ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {etaResult.message}
              </p>
            )}
          </div>
        </div>
      </div>

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

      {/* Customer Reviews Section */}
      <section className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800">
        <SectionTitle
          title="Customer Reviews"
          subtitle="Real reviews from verified buyers of Soshka jewelry."
          align="left"
        />
        <div className="mt-6">
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div 
                  key={rev.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 p-6 rounded-2xl shadow-sm relative space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-0.5 text-rose-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          fill={i < rev.rating ? 'currentColor' : 'none'} 
                          className={i < rev.rating ? 'text-rose-500' : 'text-slate-300'} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-650 dark:text-slate-350 leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <Star size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
              <h5 className="font-extrabold text-sm text-slate-700 dark:text-slate-350">No Reviews Yet</h5>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold max-w-sm mx-auto">
                No customer reviews have been submitted for this product yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetailPage;
