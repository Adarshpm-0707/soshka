import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from './Toast';

const ProductCard = ({ product }) => {
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

  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group w-full product-card-premium bg-white dark:bg-slate-850 rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col"
    >
      {/* ── Product Image ── */}
      <Link
        to={`/products/${product.id}`}
        className="block relative w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
        style={{ paddingBottom: '100%' /* 1:1 aspect ratio */ }}
      >
        <img
          src={
            product.images?.[0] ||
            'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60'
          }
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Wishlist button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm hover:scale-110 hover:bg-[#ff2a85] hover:text-white transition-all duration-300 pointer-events-auto group/fav"
          aria-label="Wishlist"
        >
          <Heart
            size={14}
            fill={isFavorite ? '#ff2a85' : 'none'}
            className={isFavorite ? 'text-[#ff2a85] group-hover/fav:text-white' : 'text-slate-500 dark:text-slate-400 group-hover/fav:text-white transition-colors'}
          />
        </button>

        {/* Sale badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#98183f] dark:bg-[#ff2a85] text-white text-[9px] font-extrabold rounded-lg uppercase tracking-wider shadow-sm">
            Sale
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
        <Link to={`/products/${product.id}`} className="hover:text-[#98183f] transition-colors">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-[15px] leading-snug line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-0.5">
          <Star size={11} className="text-amber-400 shrink-0" fill="currentColor" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {product.rating || '0.0'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            ({product.review_count || 0})
          </span>
        </div>

        {/* Price + Add to Cart — pushed to bottom */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">

          {/* Price block */}
          <div className="flex flex-col min-w-0">
            {hasDiscount ? (
              <>
                <span className="text-[10px] text-slate-400 line-through leading-none mb-0.5">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                  {formatCurrency(product.discount_price)}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            title={product.stock === 0 ? 'Out of stock' : 'Add to Cart'}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#98183f] hover:bg-[#7a1232] dark:bg-[#98183f] dark:hover:bg-[#ff2a85] dark:hover:shadow-[0_0_15px_rgba(255,42,133,0.3)] disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:shadow-none transition-all duration-300"
          >
            <ShoppingCart size={13} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
