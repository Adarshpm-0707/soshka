import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { orderService } from '../../services/orderService';
import { SHIPPING_CHARGES, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../../utils/constants';
import Loader from '../../components/Reusable/Loader';
import { showToast } from '../../components/Reusable/Toast';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Button from '../../components/Reusable/Button';
import { ArrowLeft, CreditCard, ShieldCheck, Truck, Check, Lock, ChevronDown, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'cod'
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Safely extract shipping address from route state
  const shippingAddress = location.state?.shippingAddress;

  // Compute billing summary
  const shippingCost = cartTotal > 0 && cartTotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_CHARGES : 0;
  const taxCost = cartTotal * TAX_RATE;
  const grandTotal = cartTotal + shippingCost + taxCost;

  // Read Razorpay key from frontend bundle environment
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  // Load Razorpay script helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Create Order in DB & clear cart helper
  const handleOrderCreation = async (paymentId) => {
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        name: item.product.name,
        price: item.product.discount_price || item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0],
        size: item.size || ''
      }));

      // Create Order
      const newOrder = await orderService.createOrder({
        userId: user.id,
        items: orderItems,
        total: grandTotal,
        shippingAddress,
        paymentId
      });

      // Dispatch order details and request courier pickup from Shiprocket
      try {
        console.log('Dispatching order to Shiprocket...');
        const shiprocketRes = await fetch('/api/shiprocket-pickup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order: newOrder,
            email: shippingAddress?.email || user?.email
          })
        });

        if (!shiprocketRes.ok) {
          const errData = await shiprocketRes.json();
          console.warn('Shiprocket integration returned an error:', errData.error);
        } else {
          const shipData = await shiprocketRes.json();
          console.log('Shiprocket order pushed successfully:', shipData);
        }
      } catch (shipErr) {
        console.error('Failed to dispatch order to Shiprocket:', shipErr);
      }

      // Dispatch order confirmation email
      try {
        console.log('Dispatching order confirmation email...');
        const emailConfirmRes = await fetch('/api/send-order-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order: newOrder,
            email: shippingAddress?.email || user?.email
          })
        });

        if (!emailConfirmRes.ok) {
          const errData = await emailConfirmRes.json();
          console.warn('Email confirmation integration returned an error:', errData.error);
        } else {
          console.log('Order confirmation email sent successfully!');
        }
      } catch (emailErr) {
        console.error('Failed to dispatch order confirmation email:', emailErr);
      }

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

  // Checkout with Razorpay
  const handleRazorpayPayment = async () => {
    if (!razorpayKey) {
      showToast('Razorpay configuration is missing on the client side.', 'error');
      return;
    }

    setLoading(true);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you connected to the internet?');
      }

      // 1. Create order on the backend
      const amountPaise = Math.round(grandTotal * 100);
      const receiptId = `receipt_${user?.id?.slice(0, 8) || 'user'}_${Date.now()}`;
      
      let order_id = null;
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
        const errText = await createOrderRes.text();
        throw new Error(`Failed to initialize payment gateway: ${errText}`);
      }

      const orderData = await createOrderRes.json();
      order_id = orderData.order_id;

      // 2. Configure checkout options
      const options = {
        key: razorpayKey,
        amount: amountPaise,
        currency: 'INR',
        name: 'Soshka Store',
        description: 'Secure Order Payment',
        order_id: order_id,
        image: '',
        handler: async function (response) {
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

            // 4. Record order details in database on successful validation
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
          email: shippingAddress.email || user?.email || ''
        },
        theme: {
          color: '#8b5cf6'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            showToast('Payment window closed.', 'info');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        showToast(response.error.description || 'Payment process failed.', 'error');
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      console.error('Razorpay initialization error:', err);
      showToast(err.message || 'Error initializing payment gateway.', 'error');
    }
  };

  // Place Cash on Delivery order
  const handleCODPayment = async () => {
    setLoading(true);
    const codPaymentId = `cod_${Math.random().toString(36).substr(2, 9)}`;
    await handleOrderCreation(codPaymentId);
  };

  const handleCheckoutSubmit = () => {
    if (paymentMethod === 'razorpay') {
      handleRazorpayPayment();
    } else {
      handleCODPayment();
    }
  };

  // Safety check: if no shipping address or empty cart, redirect back
  useEffect(() => {
    if (!shippingAddress) {
      showToast('Shipping address is required to place order.', 'error');
      navigate('/checkout');
      return;
    }
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }
  }, [shippingAddress, cartItems, navigate]);

  if (loading) {
    return <Loader fullScreen text="Confirming order details & verifying transaction..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-905 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        
        {/* Step Progress Bar */}
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

        {/* Main Interface Wrapper */}
        <div className="bg-white/80 dark:bg-slate-850/80 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl shadow-slate-100/40 dark:shadow-none overflow-hidden">
          
          {/* Header Gradient Accent */}
          <div className="bg-gradient-to-r from-primary-600 to-pink-600 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={120} />
            </div>
            <h2 className="text-2xl font-black tracking-tight font-sans">Complete Your Purchase</h2>
            <p className="text-white/80 text-xs font-semibold mt-1">Review checkout totals and choose your billing method below.</p>
          </div>

          <div className="p-8 space-y-6">
            {/* Elegant Order Overview Block */}
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

              {/* Collapsible Pricing Breakdown */}
              {showBreakdown && (
                <div className="border-t border-slate-200/60 dark:border-slate-800 pt-4 space-y-2 text-xs font-bold text-slate-500">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="text-slate-800 dark:text-slate-200">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Charges:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (GST 18%):</span>
                    <span className="text-slate-800 dark:text-slate-200">{formatCurrency(taxCost)}</span>
                  </div>
                </div>
              )}

              {/* Shipping Destination Summary */}
              <div className="border-t border-slate-200/60 dark:border-slate-800 pt-4 text-xs text-slate-450 space-y-1">
                <span className="font-black uppercase tracking-widest text-[9px] text-slate-400 block">Deliver to</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200">{shippingAddress?.name} — {shippingAddress?.phone}</p>
                {shippingAddress?.email && <p className="font-bold text-primary-600 dark:text-primary-400">{shippingAddress.email}</p>}
                <p className="line-clamp-1">{shippingAddress?.addressLine}, {shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.postalCode}</p>
              </div>
            </div>

            {/* Custom Payment Option Selectors */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Options</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Razorpay Options Card */}
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

                {/* COD Options Card */}
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
                      <span className="text-sm font-black text-slate-855 dark:text-slate-100 block group-hover:text-emerald-500 transition">Cash on Delivery</span>
                      <span className="text-xs text-slate-450 block font-semibold">Pay with cash at your door</span>
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

            {/* Glowing Action Button */}
            <div className="pt-4">
              <button
                onClick={handleCheckoutSubmit}
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

            {/* Verified Footer badges */}
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
