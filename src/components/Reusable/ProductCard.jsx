import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from './Toast';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const isFavorite = isInWishlist(product.id);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isFavorite) {
        await removeFromWishlist(product.id);
        showToast('Removed from wishlist', 'info');
      } else {
        await addToWishlist(product);
        showToast('Added to wishlist', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error updating wishlist', 'error');
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      showToast('Added to cart', 'success');
    } catch (err) {
      showToast(err.message || 'Error adding to cart', 'error');
    }
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      navigate('/cart');
    } catch (err) {
      showToast(err.message || 'Error adding to cart', 'error');
    }
  };

  const originalPrice = product.original_price ?? product.price;
  const offerPrice = product.offer_price;
  const offer = product.offers || product.offer;
  const isOfferActive = !!(offerPrice && Number(offerPrice) > 0);

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group w-full product-card-premium bg-white dark:bg-slate-850 rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col"
    >
      {/* ── Product Image ── */}
      <Link
        to={`/products/${product.slug || product.id}`}
        className="block relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
        style={{ paddingBottom: '100%' /* 1:1 aspect ratio */ }}
      >
        <img
          src={product.images?.[0] || ''}
          alt={`${product.name} - Anti-Tarnish Premium Jewellery`}
          width="400"
          height="400"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Wishlist button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm hover:scale-110 hover:bg-[#ff2a85] hover:text-white transition-all duration-300 pointer-events-auto group/fav"
          aria-label={isFavorite ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <span className="sr-only">{isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}</span>
          <Heart
            size={14}
            fill={isFavorite ? '#ff2a85' : 'none'}
            className={isFavorite ? 'text-[#ff2a85] group-hover/fav:text-white' : 'text-slate-500 dark:text-slate-400 group-hover/fav:text-white transition-colors'}
          />
        </button>

        {/* Sale badge */}
        {isOfferActive && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#98183f] dark:bg-[#ff2a85] text-white text-[9px] font-extrabold rounded-lg uppercase tracking-wider shadow-sm max-w-[80%] truncate" title={offer?.message || 'Offer'}>
            {offer?.message || `${Math.round(((originalPrice - offerPrice) / originalPrice) * 100)}% OFF`}
          </span>
        )}
      </Link>

      {/* ── Card Details ── */}
      <div className="flex flex-col flex-grow p-3 sm:p-4 gap-2">

        {/* Category */}
        <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#98183f] leading-none">
          {product.category}
        </span>

        {/* Product Name */}
        <Link to={`/products/${product.slug || product.id}`} className="hover:text-[#98183f] transition-colors block h-[40px] sm:h-[44px] overflow-hidden">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-[15px] leading-snug line-clamp-2">
            {product.name}
          </h3>
        </Link>



        {/* Price + Add to Cart — pushed to bottom */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">

          {/* Price block */}
          <div className="flex flex-col min-w-0 h-[46px] sm:h-[50px] justify-end">
            {isOfferActive ? (
              <>
                <span className="text-[10px] text-slate-400 line-through leading-none mb-0.5">
                  {formatCurrency(originalPrice)}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[#98183f] dark:text-[#ff2a85] leading-tight truncate">
                  {formatCurrency(offerPrice)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] text-transparent leading-none mb-0.5 select-none" aria-hidden="true">
                  &nbsp;
                </span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                  {formatCurrency(originalPrice)}
                </span>
              </>
            )}
            <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1 block leading-none">
              incl. GST
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Add to Cart Icon-Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              title={product.stock === 0 ? 'Out of stock' : 'Add to Cart'}
              className="p-2 rounded-xl text-[#98183f] dark:text-[#ff2a85] bg-slate-100 dark:bg-slate-800 hover:bg-[#98183f]/10 dark:hover:bg-slate-700/60 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 transition-all duration-200"
              aria-label="Add to Cart"
            >
              <span className="sr-only">Add to Cart</span>
              <ShoppingCart size={13} />
            </button>

            {/* Buy Now Button */}
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black text-white bg-[#98183f] hover:bg-[#7a1232] dark:bg-[#ff2a85] dark:hover:bg-[#e01f72] dark:hover:shadow-[0_0_15px_rgba(255,42,133,0.3)] disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 transition-all duration-200 shrink-0"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
