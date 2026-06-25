import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../hooks/useCart';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Loader from '../../components/Reusable/Loader';
import Button from '../../components/Reusable/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { showToast } from '../../components/Reusable/Toast';

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleMoveToCart = async (product) => {
    try {
      // 1. Add to shopping cart
      await addToCart(product, 1);
      // 2. Remove from wishlist
      await removeFromWishlist(product.id);
      showToast('Moved product to shopping cart!', 'success');
    } catch (err) {
      showToast('Error moving item to cart', 'error');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      showToast('Removed from wishlist', 'info');
    } catch (err) {
      showToast('Error removing item', 'error');
    }
  };

  if (loading && wishlistItems.length === 0) {
    return <Loader fullScreen text="Loading saved wishlist..." />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      
      {/* Required SectionTitle */}
      <SectionTitle
        title="My Wishlist"
        subtitle="Manage your saved items. Review details, delete bookmarks, or move items straight to cart."
        align="left"
      />

      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full mb-4">
            <Heart size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-850 dark:text-white mb-2 font-sans">
            Your wishlist is empty
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 text-sm">
            You haven't bookmarked any products yet. Take a look at our current listings to find products you love!
          </p>
          <Button onClick={() => navigate('/products')}>Explore Products</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {wishlistItems.map((item) => {
            const product = item.product;
            if (!product) return null;

            const price = product.discount_price || product.price;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative group hover:shadow-md hover:-translate-y-1 transition duration-200"
              >
                {/* Image */}
                <div className="aspect-square bg-slate-100 dark:bg-slate-850 overflow-hidden relative">
                  <img
                    src={product.images?.[0] || ''}
                    alt={product.name}
                    className="object-cover w-full h-full transform group-hover:scale-103 transition duration-500"
                  />
                  
                  {/* Delete overlay button */}
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 text-slate-450 hover:text-red-500 rounded-full shadow transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4.5 flex-grow flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest block">
                      {product.category}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1 text-sm md:text-base">
                      {product.name}
                    </h4>
                    <span className="text-base font-extrabold text-slate-905 dark:text-white block">
                      {formatCurrency(price)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      onClick={() => handleMoveToCart(product)}
                      className="w-full text-xs font-bold"
                      size="sm"
                      icon={ShoppingCart}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Move to Cart'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
