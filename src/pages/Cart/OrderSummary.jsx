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
