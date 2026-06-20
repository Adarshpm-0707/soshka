import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { orderService } from '../../services/orderService';
import { SHIPPING_CHARGES, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Button from '../../components/Reusable/Button';
import Loader from '../../components/Reusable/Loader';
import { showToast } from '../../components/Reusable/Toast';
import { ShieldCheck, CreditCard, ArrowLeft } from 'lucide-react';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Safely extract shipping address from route state
  const shippingAddress = location.state?.shippingAddress;

  // Compute billing summary
  const isFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = cartTotal === 0 ? 0 : (isFreeShipping ? 0 : SHIPPING_CHARGES);
  const taxCost = cartTotal * TAX_RATE;
  const grandTotal = cartTotal + shippingCost + taxCost;

  // Safety check: if no shipping address or empty cart, redirect back
  useEffect(() => {
    if (!shippingAddress) {
      showToast('Shipping address is required to make payment.', 'error');
      navigate('/checkout');
      return;
    }
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    // Load Razorpay Script dynamically
    const loadRazorpay = async () => {
      const res = await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
      setScriptLoaded(res);
    };

    loadRazorpay();
  }, [shippingAddress, cartItems, navigate]);

  // Create Order in DB & clear cart helper
  const handleOrderCreation = async (paymentId) => {
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        name: item.product.name,
        price: item.product.discount_price || item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0]
      }));

      // Create Order
      const newOrder = await orderService.createOrder({
        userId: user.id,
        items: orderItems,
        total: grandTotal,
        shippingAddress,
        paymentId
      });

      // Clear DB/Local Cart
      await clearCart();
      
      showToast('Order placed successfully!', 'success');
      
      // Redirect to Order Detail view
      navigate(`/orders/${newOrder.id}`);
    } catch (err) {
      console.error('Error creating order:', err);
      showToast('Error recording purchase. Please contact support.', 'error');
    }
  };

  // Option 1: Trigger Live/Test Razorpay Gateway
  const handleRazorpayPayment = async () => {
    if (!scriptLoaded) {
      showToast('Razorpay SDK failed to load. Please try simulator.', 'error');
      return;
    }

    setLoading(true);
    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockKey';

      // 1. Create order on the backend
      const amountPaise = Math.round(grandTotal * 100);
      const receiptId = `receipt_${user?.id?.slice(0, 8) || 'user'}_${Date.now()}`;
      
      const createOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: receiptId,
        }),
      });

      if (!createOrderRes.ok) {
        const errorData = await createOrderRes.json();
        throw new Error(errorData.error || 'Failed to initialize payment order on server.');
      }

      const { order_id } = await createOrderRes.json();

      // 2. Configure checkout options
      const options = {
        key: razorpayKey,
        amount: amountPaise,
        currency: 'INR',
        name: 'Soshka Store',
        description: 'Payment for order checkouts',
        image: '',
        order_id: order_id,
        handler: async function (response) {
          setLoading(true);
          try {
            // 3. Verify signature on the backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const verifyError = await verifyRes.json();
              throw new Error(verifyError.error || 'Payment signature verification failed.');
            }

            // 4. Record order details in database
            await handleOrderCreation(response.razorpay_payment_id);
          } catch (err) {
            setLoading(false);
            console.error('Payment verification error:', err);
            showToast(err.message || 'Payment verification failed.', 'error');
          }
        },
        prefill: {
          name: shippingAddress.name,
          contact: shippingAddress.phone,
          email: user?.email || ''
        },
        theme: {
          color: '#8b5cf6' // primary-500 violet color
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            showToast('Payment cancelled by user.', 'info');
          }
        }
      };

      const rzp = new window.Razorpay(options);

      // Listen for payment failure events
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed details:', response.error);
        showToast(response.error.description || 'Payment process failed.', 'error');
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      console.error('Razorpay payment setup error:', err);
      showToast(err.message || 'Error opening Razorpay payment window.', 'error');
    }
  };

  // Option 2: Fallback Simulator for Local Development (highly helpful!)
  const handleSimulatedPayment = async () => {
    setLoading(true);
    // Simulate API latency
    setTimeout(async () => {
      const mockPaymentId = `pay_sim_${Math.random().toString(36).substr(2, 9)}`;
      await handleOrderCreation(mockPaymentId);
    }, 1500);
  };

  if (loading) {
    return <Loader fullScreen text="Processing payment & recording order details..." />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/checkout')}
        className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-450 hover:text-primary-600 transition mb-6"
      >
        <ArrowLeft size={14} />
        <span>Back to Shipping Address</span>
      </button>

      {/* Required SectionTitle */}
      <SectionTitle
        title="Payment Gateway"
        subtitle="Complete your payment securely. Choose the default Razorpay popup or simulate a transaction."
      />

      <div className="bg-white dark:bg-slate-850 p-8 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm space-y-6 mt-6">
        
        {/* Billing Overview */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Totals</h4>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Grand Total Due</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(grandTotal)}
            </span>
          </div>
          <div className="text-xs text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-750">
            <span className="font-bold block mb-1 uppercase tracking-wider text-slate-500">Shipping To:</span>
            <p>{shippingAddress?.name} — {shippingAddress?.phone}</p>
            <p>{shippingAddress?.addressLine}, {shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.postalCode}</p>
          </div>
        </div>

        {/* Payment actions triggers */}
        <div className="space-y-4">
          <Button
            onClick={handleRazorpayPayment}
            className="w-full flex justify-center py-3 bg-violet-650 hover:bg-violet-750"
            icon={CreditCard}
          >
            Pay with Razorpay
          </Button>

          {/* Sandbox Development simulator option */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 border-t border-slate-200 dark:border-slate-850" />
            <span className="relative px-3 bg-white dark:bg-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Development Option
            </span>
          </div>

          <Button
            onClick={handleSimulatedPayment}
            variant="outline"
            className="w-full border-dashed"
          >
            Simulate Sandbox Payment Success
          </Button>
        </div>

        {/* Security checks */}
        <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider pt-2">
          <ShieldCheck className="text-emerald-500 h-5 w-5" />
          <span>SSL Secured Transaction Pipeline</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
