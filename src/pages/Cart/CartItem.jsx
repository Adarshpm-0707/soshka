import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import { showToast } from '../../components/Reusable/Toast';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const product = item.product;

  const [deleting, setDeleting] = useState(false);
  const [updatingQty, setUpdatingQty] = useState(false);

  if (!product) return null;

  const originalPrice = product.original_price ?? product.price;
  const offerPrice = product.offer_price;
  const offer = product.offers || product.offer;
  const isOfferActive = !!(offerPrice && Number(offerPrice) > 0);

  const unitPrice = isOfferActive ? offerPrice : originalPrice;
  const itemTotal = unitPrice * item.quantity;

  const handleRemove = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await removeFromCart(item.id);
      showToast('Item removed from cart', 'info');
    } catch (err) {
      console.error('Remove from cart error:', err);
      showToast(err?.message || 'Failed to remove item. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleQuantity = async (newQty) => {
    if (updatingQty) return;
    setUpdatingQty(true);
    try {
      await updateQuantity(item.id, newQty);
    } catch (err) {
      console.error('Update quantity error:', err);
      showToast(err?.message || 'Failed to update quantity.', 'error');
    } finally {
      setUpdatingQty(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white dark:bg-[#0c0c0d] rounded-2xl border border-slate-200/60 dark:border-[#1c1c1e] shadow-sm gap-4 transition-opacity duration-200">

      {/* Product Image + Info */}
      <div className="flex items-center space-x-4 min-w-0">
        <Link to={`/products/${product.id}`} className="shrink-0">
          <img
            src={product.images?.[0] || ''}
            alt={product.name}
            className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-[#1c1c1e] hover:opacity-90 transition"
          />
        </Link>
        <div className="min-w-0">
          <Link to={`/products/${product.id}`}>
            <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1 text-sm md:text-base hover:text-[#98183f] dark:hover:text-[#ff2a85] transition-colors">
              {product.name}
            </h4>
          </Link>
          <p className="text-[10px] font-extrabold text-[#98183f] dark:text-[#ff2a85] uppercase tracking-widest mt-0.5">
            {product.category}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {formatCurrency(unitPrice)} / unit
          </p>
        </div>
      </div>

      {/* Qty + Price + Delete */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-10">

        {/* Quantity control */}
        <div className="flex items-center space-x-1 border border-slate-200 dark:border-[#1c1c1e] rounded-xl overflow-hidden bg-slate-50 dark:bg-[#121214]">
          <button
            onClick={() => handleQuantity(item.quantity - 1)}
            disabled={updatingQty || item.quantity <= 1}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1c1c1e] transition disabled:opacity-30"
            title="Decrease quantity"
          >
            {updatingQty ? <Loader2 size={12} className="animate-spin" /> : <Minus size={12} />}
          </button>
          <span className="px-3 text-xs font-bold text-slate-800 dark:text-white min-w-[28px] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => handleQuantity(item.quantity + 1)}
            disabled={updatingQty || item.quantity >= product.stock}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1c1c1e] transition disabled:opacity-30"
            title="Increase quantity"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Item subtotal */}
        <div className="text-right min-w-[80px]">
          <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
            {formatCurrency(itemTotal)}
          </span>
          {isOfferActive && (
            <span className="text-[10px] text-slate-400 line-through">
              {formatCurrency(originalPrice * item.quantity)}
            </span>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={handleRemove}
          disabled={deleting}
          className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remove item"
        >
          {deleting
            ? <Loader2 size={16} className="animate-spin text-red-400" />
            : <Trash2 size={16} />
          }
        </button>
      </div>
    </div>
  );
};

export default CartItem;
