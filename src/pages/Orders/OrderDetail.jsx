import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Loader from '../../components/Reusable/Loader';
import Badge from '../../components/Reusable/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { SHIPPING_CHARGES, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../../utils/constants';
import { ArrowLeft, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { showToast } from '../../components/Reusable/Toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Order not found');
        showToast('Error loading order details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]);

  if (loading) return <Loader fullScreen text="Loading invoice sheet..." />;
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-red-500 mb-4">Error loading order</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-primary-650 hover:bg-primary-750 text-white rounded-lg transition"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  // Recalculate original split for summary preview
  // Wait, total = subtotal + shipping + tax
  // We can calculate subtotal by multiplying items, then apply shipping/tax.
  const itemsList = order.items || [];
  const calculatedSubtotal = itemsList.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const isFreeShipping = calculatedSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = calculatedSubtotal === 0 ? 0 : (isFreeShipping ? 0 : SHIPPING_CHARGES);
  const taxCost = calculatedSubtotal * TAX_RATE;

  const dateStr = new Date(order.created_at).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 bg-slate-55 dark:bg-slate-905 transition-colors duration-300">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-450 hover:text-primary-600 transition mb-6"
      >
        <ArrowLeft size={14} />
        <span>Back to My Orders</span>
      </button>

      {/* Required SectionTitle */}
      <SectionTitle
        title="Order Invoice Details"
        subtitle={`Order Reference: #${order.id}`}
        align="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
        {/* Left Side: Items & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Details & Meta */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Metadata</span>
              <Badge status={order.status} />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Placed on <span className="text-slate-800 dark:text-white font-bold">{dateStr}</span>
            </p>
          </div>

          {/* Line Items List */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Purchased Items
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {itemsList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-4.5 gap-4">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={item.image || ''}
                      alt={item.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                    />
                    <div>
                      <h5 className="font-bold text-slate-850 dark:text-white text-sm line-clamp-1">
                        {item.name}
                      </h5>
                      <span className="text-xs text-slate-400 font-semibold">
                        Qty: {item.quantity} x {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Shipping & Billing summaries */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Shipping Address Details Card */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center space-x-2 text-slate-450 border-b border-slate-100 dark:border-slate-800 pb-3">
              <MapPin size={16} />
              <h4 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider font-sans">
                Shipping Address
              </h4>
            </div>
            <div className="text-xs font-semibold text-slate-655 dark:text-slate-350 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">{order.shipping_address?.name}</p>
              <p>{order.shipping_address?.phone}</p>
              <p>{order.shipping_address?.addressLine}</p>
              <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
              <p>PIN: {order.shipping_address?.postalCode}</p>
            </div>
          </div>

          {/* Payment & Receipts Card */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center space-x-2 text-slate-450 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CreditCard size={16} />
              <h4 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider font-sans">
                Payment Info
              </h4>
            </div>
            <div className="text-xs font-semibold text-slate-655 dark:text-slate-350 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gateway Reference</p>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">{order.payment_id || 'Mock Payment Gateway'}</p>
              <span className="inline-flex items-center text-[10px] text-emerald-500 bg-emerald-50/15 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-bold">
                <ShieldCheck size={12} className="mr-1" /> Approved
              </span>
            </div>
          </div>

          {/* Invoice pricing Calculations */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-850 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-wider font-sans">
              Billing Breakdown
            </h4>
            <div className="space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800 dark:text-white">{formatCurrency(calculatedSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Charges</span>
                <span className="text-slate-800 dark:text-white">
                  {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (18%)</span>
                <span className="text-slate-800 dark:text-white">{formatCurrency(taxCost)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                <span>Total Paid</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
