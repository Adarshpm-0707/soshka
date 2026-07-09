import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { orderService } from '../../services/orderService';
import { initiateRazorpayPayment, initiateCODPayment } from '../../services/checkoutService';
import { SHIPPING_CHARGES, FREE_SHIPPING_THRESHOLD } from '../../utils/constants';
import Loader from '../../components/Reusable/Loader';
import { showToast } from '../../components/Reusable/Toast';
import Button from '../../components/Reusable/Button';
import {
  ArrowLeft, CreditCard, ShieldCheck, Truck, Check,
  Lock, ChevronDown, Sparkles, RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [showBreakdown, setShowBreakdown] = useState(false);
  // For retry: store pending db_order_id if user dismissed modal
  const [pendingOrderId, setPendingOrderId] = useState(null);

  const shippingAddress = location.state?.shippingAddress;

  // Display-only cost calculation (actual totals computed server-side for Razorpay/COD)
  const shippingCost = 0;
  const codFee = paymentMethod === 'cod' ? 60 : 0;
  const grandTotal = cartTotal + codFee;

  // ─── Razorpay Payment (via Edge Functions) ────────────────────────────────
  const handleRazorpayPayment = async () => {
    setLoading(true);
    setPendingOrderId(null);

    try {
      const { success, db_order_id } = await initiateRazorpayPayment(
        cartItems,
        shippingAddress,
        { name: shippingAddress?.name, email: shippingAddress?.email, phone: shippingAddress?.phone }
      );

      if (success) {
        await handlePostPaymentSuccess(db_order_id);
      }
    } catch (err) {
      setLoading(false);

      if (err.cancelled) {
        // User dismissed the Razorpay modal — order stays 'pending'
        setPendingOrderId(err.db_order_id || null);
        showToast('Payment window closed. You can retry below.', 'info');
      } else if (err.paymentFailed) {
        // Razorpay payment.failed event fired
        showToast(err.error || 'Payment was declined. Please try a different method.', 'error');
      } else {
        console.error('Payment error:', err);
        showToast(err.message || 'Payment failed. Please try again.', 'error');
      }
    }
  };

  // ─── Post-payment success actions ────────────────────────────────────────
  const handlePostPaymentSuccess = async (dbOrderId) => {
    try {
      // Note: email is already fired server-side from create-cod-order / verify-razorpay-payment.
      // This is a frontend safety-net call in case the server-side trigger missed.
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ order_id: dbOrderId }),
      }).then(async (r) => {
        if (r.ok) {
          const d = await r.json();
          console.log('[Email] Confirmation sent to', d.sent_to);
        } else {
          console.warn('[Email] Edge fn returned', r.status);
        }
      }).catch((e) => console.warn('[Email] Non-blocking send failed:', e));

      // Clear cart and navigate to order detail
      await clearCart();
      showToast('Order placed successfully! 🎉', 'success');
      navigate(`/orders/${dbOrderId}`);
    } catch (err) {
      setLoading(false);
      console.error('Post-payment error:', err);
      showToast('Order confirmed but failed to load details. Check your orders page.', 'warning');
      navigate('/orders');
    }
  };


  // ─── COD Order ───────────────────────────────────────────────────────────
  const handleCODPayment = async () => {
    setLoading(true);
    try {
      const { success, db_order_id } = await initiateCODPayment(
        cartItems,
        shippingAddress
      );

      if (success) {
        await handlePostPaymentSuccess(db_order_id);
      }
    } catch (err) {
      setLoading(false);
      console.error('COD error:', err);
      showToast(err.message || 'Failed to place COD order.', 'error');
    }
  };

  const handleCheckoutSubmit = () => {
    setPendingOrderId(null);
    if (paymentMethod === 'razorpay') {
      handleRazorpayPayment();
    } else {
      handleCODPayment();
    }
  };

  // Safety redirect
  useEffect(() => {
    if (!shippingAddress) {
      showToast('Shipping address is required.', 'error');
      navigate('/checkout');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [shippingAddress, cartItems, navigate]);

  if (loading) {
    return <Loader fullScreen text="Confirming order details & verifying transaction..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-905 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Step Progress */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-10 text-xs font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center space-x-2 text-slate-500">
            <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">1</span>
            <span>Cart</span>
          </div>
          <div className="h-0.5 flex-grow bg-slate-200 dark:bg-slate-800 mx-4" />
          <div className="flex items-center space-x-2 text-slate-500">
            <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">2</span>
            <span>Delivery</span>
          </div>
          <div className="h-0.5 flex-grow bg-slate-200 dark:bg-slate-800 mx-4" />
          <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
            <span className="h-6 w-6 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center text-[10px]">3</span>
            <span className="font-extrabold">Payment</span>
          </div>
        </div>

        {/* Back Link */}
        <button
          onClick={() => navigate('/checkout')}
          className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-slate-450 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition mb-6"
        >
          <ArrowLeft size={14} />
          <span>Back to Shipping Address</span>
        </button>

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-slate-850/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl shadow-slate-100/40 dark:shadow-none overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-pink-600 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={120} />
            </div>
            <h2 className="text-2xl font-black tracking-tight font-sans">Complete Your Purchase</h2>
            <p className="text-white/80 text-xs font-semibold mt-1">Review checkout totals and choose your billing method below.</p>
          </div>

          <div className="p-8 space-y-6">

            {/* Order Overview */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Payable Amount</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(grandTotal)}</span>
                </div>
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="flex items-center space-x-1.5 text-[10px] font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-wider bg-white dark:bg-slate-800 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 active:scale-95 transition"
                >
                  <span>{showBreakdown ? 'Hide Breakdown' : 'Show Details'}</span>
                  <ChevronDown size={12} className={`transition-transform duration-300 ${showBreakdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showBreakdown && (
                <div className="border-t border-slate-200/60 dark:border-slate-800 pt-4 space-y-2 text-xs font-bold text-slate-500">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="text-slate-800 dark:text-slate-200">{formatCurrency(cartTotal)}</span>
                  </div>
                  {paymentMethod === 'cod' && (
                    <div className="flex justify-between">
                      <span>COD Fee:</span>
                      <span className="text-slate-800 dark:text-slate-200">{formatCurrency(60)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping Charges:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
                    </span>
                  </div>
                </div>
              )}

              {/* Delivery Address Summary */}
              <div className="border-t border-slate-200/60 dark:border-slate-800 pt-4 text-xs text-slate-450 space-y-1">
                <span className="font-black uppercase tracking-widest text-[9px] text-slate-400 block">Deliver to</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200">{shippingAddress?.name} — {shippingAddress?.phone}</p>
                {shippingAddress?.email && <p className="font-bold text-primary-600 dark:text-primary-400">{shippingAddress.email}</p>}
                <p className="line-clamp-1">{shippingAddress?.addressLine}, {shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.postalCode}</p>
              </div>
            </div>

            {/* Retry banner (shown after modal dismissed) */}
            {pendingOrderId && paymentMethod === 'razorpay' && (
              <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-5 py-4">
                <div>
                  <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">Payment window closed</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Your order is saved. Click Retry to complete payment.</p>
                </div>
                <button
                  onClick={handleRazorpayPayment}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Options</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Razorpay */}
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between group select-none ${
                    paymentMethod === 'razorpay'
                      ? 'border-primary-500 bg-primary-500/[0.03] dark:bg-primary-500/[0.08] shadow-md shadow-primary-500/5'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-sm font-black text-slate-850 dark:text-slate-100 block group-hover:text-primary-600 transition">Pay Online</span>
                      <span className="text-xs text-slate-450 block font-semibold">UPI, Cards, Netbanking, Wallets</span>
                    </div>
                    <div className={`h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center transition-all ${
                      paymentMethod === 'razorpay' ? 'border-primary-500 bg-primary-500 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {paymentMethod === 'razorpay' && <Check size={11} strokeWidth={4} />}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-6 text-primary-500">
                    <CreditCard size={18} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Fast & Secure Checkout</span>
                  </div>
                </div>

                {/* COD */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between group select-none ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.08] shadow-md shadow-emerald-500/5'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-sm font-black text-slate-855 dark:text-slate-100 block group-hover:text-emerald-500 transition">Cash on Delivery (+ ₹60)</span>
                      <span className="text-xs text-slate-450 block font-semibold">Pay with cash at your door (+ ₹60 Handling Fee)</span>
                    </div>
                    <div className={`h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center transition-all ${
                      paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {paymentMethod === 'cod' && <Check size={11} strokeWidth={4} />}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-6 text-emerald-500">
                    <Truck size={18} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Cash on Delivery option</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={handleCheckoutSubmit}
                id="payment-submit-btn"
                className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl text-white text-sm font-black uppercase tracking-wider shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${
                  paymentMethod === 'razorpay'
                    ? 'bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-700 hover:to-violet-700 shadow-primary-500/20'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
                }`}
              >
                <Lock size={14} className="mr-1" />
                <span>
                  {paymentMethod === 'razorpay' ? 'Proceed to Secure Payment' : 'Confirm Cash on Delivery'}
                </span>
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center space-x-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-slate-800">
              <ShieldCheck className="text-emerald-500 h-4.5 w-4.5" />
              <span>SSL Secured Transaction Pipeline • Powered by Razorpay</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
