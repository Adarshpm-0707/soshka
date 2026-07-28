import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import { SHIPPING_CHARGES, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../../utils/constants';
import Button from '../../components/Reusable/Button';
import CouponInput from '../../components/Reusable/CouponInput';
import { showToast } from '../../components/Reusable/Toast';

const OrderSummary = ({ showCheckoutBtn = true }) => {
  const {
    cartTotal,
    cartItems,
    appliedCoupon,
    discountAmount,
    finalTotal,
    setAppliedCoupon,
    removeCoupon
  } = useCart();
  const navigate = useNavigate();

  const shippingCost = 0;
  const taxCost = 0;
  const grandTotal = finalTotal;

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

  const handleCouponApply = (coupon, discount) => {
    setAppliedCoupon(coupon);
  };

  const handleCouponRemove = () => {
    removeCoupon();
  };

  return (
    <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 font-sans tracking-wide">
        Order Summary
      </h3>

      {/* Coupon Input Section */}
      <div className="py-1">
        <CouponInput
          appliedCoupon={appliedCoupon}
          onApply={handleCouponApply}
          onRemove={handleCouponRemove}
        />
      </div>

      <div className="space-y-2.5 text-sm font-semibold border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex justify-between text-slate-500 dark:text-slate-400">
          <span>Subtotal</span>
          <span className="text-slate-800 dark:text-white">{formatCurrency(cartTotal)}</span>
        </div>

        {appliedCoupon && discountAmount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="flex items-center space-x-1">
              <span>Discount</span>
              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                ({appliedCoupon.code})
              </span>
            </span>
            <span>- {formatCurrency(discountAmount)}</span>
          </div>
        )}

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
        <span>Total</span>
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
