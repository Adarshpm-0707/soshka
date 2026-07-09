import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import { SHIPPING_CHARGES, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../../utils/constants';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';

const OrderSummary = ({ showCheckoutBtn = true }) => {
  const { cartTotal, cartItems } = useCart();
  const navigate = useNavigate();

  const shippingCost = 0;
  const taxCost = 0;
  const grandTotal = cartTotal;

  // Calculate total savings from active offers
  const totalSavings = cartItems.reduce((acc, item) => {
    const product = item.product;
    if (!product) return acc;
    const originalPrice = product.original_price ?? product.price ?? 0;
    const offerPrice = product.offer_price;
    const isOfferActive = !!(offerPrice && Number(offerPrice) > 0);
    const unitPrice = isOfferActive ? offerPrice : originalPrice;
    const savings = isOfferActive ? (originalPrice - unitPrice) * item.quantity : 0;
    return acc + savings;
  }, 0);

  const handleCheckoutRedirect = () => {
    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 font-sans tracking-wide">
        Order Summary
      </h3>

      <div className="space-y-2.5 text-sm font-semibold">
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Subtotal</span>
          <span className="text-slate-800 dark:text-white">{formatCurrency(cartTotal)}</span>
        </div>
        {totalSavings > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 px-3 py-2 rounded-xl text-xs font-black">
            <span>You Save</span>
            <span>-{formatCurrency(totalSavings)}</span>
          </div>
        )}
        {shippingCost > 0 && (
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Shipping</span>
            <span className="text-slate-800 dark:text-white">{formatCurrency(shippingCost)}</span>
          </div>
        )}
        {taxCost > 0 && (
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>GST ({TAX_RATE * 100}%)</span>
            <span className="text-slate-800 dark:text-white">{formatCurrency(taxCost)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-base font-extrabold text-slate-900 dark:text-white">
        <span>Grand Total</span>
        <span>{formatCurrency(grandTotal)}</span>
      </div>

      {showCheckoutBtn && (
        <Button
          onClick={handleCheckoutRedirect}
          className="w-full mt-4"
          disabled={cartItems.length === 0}
        >
          Proceed to Checkout
        </Button>
      )}
    </div>
  );
};

export default OrderSummary;
