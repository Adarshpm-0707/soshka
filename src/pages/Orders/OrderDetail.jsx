import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import Loader from '../../components/Reusable/Loader';
import { formatCurrency } from '../../utils/formatCurrency';
import { SHIPPING_CHARGES, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../../utils/constants';
import {
  ArrowLeft, Printer, CheckCircle2, ShieldCheck, Mail, Phone, ExternalLink, Package, Truck, AlertCircle
} from 'lucide-react';
import { showToast } from '../../components/Reusable/Toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(60);
  const [isCancelable, setIsCancelable] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!order) return;

    const checkCancellationTime = () => {
      const paymentTime = order.paid_at ? new Date(order.paid_at) : new Date(order.created_at);
      const now = new Date();
      const diffMs = now.getTime() - paymentTime.getTime();
      const diffMins = diffMs / (1000 * 60);
      const leftMins = Math.max(0, Math.floor(60 - diffMins));
      
      setRemainingMinutes(leftMins);

      const allowedStatuses = ['pending', 'confirmed', 'processing', 'paid'];
      const currentStatus = order.order_status || order.status || 'pending';
      const isPrepaid = order.payment_method !== 'cod';
      const isPaid = order.payment_status === 'paid';

      setIsCancelable(
        allowedStatuses.includes(currentStatus) &&
        diffMins < 60 &&
        (isPrepaid ? isPaid : true)
      );
    };

    checkCancellationTime();
    const interval = setInterval(checkCancellationTime, 10000); // check every 10s
    return () => clearInterval(interval);
  }, [order]);

  const handleCancelOrderClick = () => {
    setShowCancelModal(true);
  };

  const executeCancelOrder = async () => {
    setShowCancelModal(false);
    setCancelling(true);
    try {
      await orderService.cancelOrder(order.id);
      showToast('Order cancelled successfully.', 'success');
      const data = await orderService.getOrderById(id);
      setOrder(data);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

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

  if (loading) return <Loader fullScreen text="Compiling boutique invoice sheet..." />;

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50 dark:bg-slate-905">
        <h2 className="text-2xl font-black text-rose-500 mb-2">Error Loading Invoice</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold transition hover:bg-slate-800"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const itemsList = order.items || [];
  const calculatedSubtotal = order.subtotal ?? itemsList.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCost = order.shipping_fee ?? (calculatedSubtotal > 0 && calculatedSubtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_CHARGES : 0);
  const taxCost = calculatedSubtotal * TAX_RATE;
  const grandTotal = order.total;

  const displayOrderId = order.id.startsWith('00000000-0000-0000-0000-')
    ? order.id.split('-').pop()
    : order.id.slice(0, 8).toUpperCase();

  const productNames = itemsList.map(i => i.name).join(', ');

  const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,450..900;1,400..900&family=Inter:wght@300;400;550;600;700;900&display=swap" rel="stylesheet" />

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .font-serif-luxury { font-family: 'Playfair Display', Georgia, serif; }
        .font-sans-luxury  { font-family: 'Inter', sans-serif; }
        @media print {
          body { background: white !important; color: #1a1a1a !important; }
          .no-print { display: none !important; }
          .print-sheet {
            width: 100% !important; max-width: 100% !important;
            padding: 0 !important; margin: 0 !important;
            box-shadow: none !important; border: none !important;
            background: white !important;
          }
          .print-rose-header { background: linear-gradient(135deg, #9f1239, #be185d) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-accent { color: #be185d !important; }
        }
      ` }} />

      <div className="mx-auto max-w-3xl">

         {/* Navigation Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6 no-print font-sans-luxury">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-450 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
          >
            <ArrowLeft size={13} />
            <span>My Orders</span>
          </button>

          <div className="flex items-center gap-3">
            {isCancelable && (
              <button
                onClick={handleCancelOrderClick}
                disabled={cancelling}
                className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 py-2.5 px-6 rounded-xl hover:scale-105 active:scale-95 transition shadow-sm disabled:opacity-50"
              >
                <span>{cancelling ? 'Cancelling...' : `Cancel Order (${remainingMinutes}m left)`}</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-6 rounded-xl hover:scale-105 active:scale-95 transition shadow-md shadow-rose-200 dark:shadow-rose-900/30"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* ── Cancellation Banner (COD) ── */}
        {((order.order_status === 'cancelled' || order.status === 'cancelled') && order.payment_method === 'cod') && (
          <div className="no-print mb-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl px-6 py-5 flex items-start gap-4 shadow-lg shadow-rose-200 dark:shadow-rose-900/20 animate-fade-in">
            <div className="mt-0.5 shrink-0">
              <AlertCircle size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-black text-base leading-tight">
                🚫 Order Cancelled
              </p>
              <p className="text-rose-50 text-xs mt-1 font-medium leading-relaxed">
                This Cash on Delivery order was cancelled successfully. No payment was charged.
              </p>
            </div>
          </div>
        )}

        {/* ── Refund Status Timeline Stepper (Prepaid) ── */}
        {((order.order_status === 'cancelled' || order.status === 'cancelled') && order.payment_method !== 'cod') && (
          <div className="no-print mb-6 bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-450">
              <Package size={20} />
              <span className="text-xs uppercase font-extrabold tracking-widest">Refund & Cancellation Timeline</span>
            </div>
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-0 pl-4 md:pl-0">
              {/* Horizontal line connector */}
              <div className="absolute top-[21px] left-0 right-0 h-0.5 bg-slate-150 dark:bg-slate-800 hidden md:block z-0" />
              {/* Vertical line connector for mobile */}
              <div className="absolute top-0 bottom-0 left-[21px] w-0.5 bg-slate-150 dark:bg-slate-800 block md:hidden z-0" />

              {(() => {
                const steps = [
                  { label: "Order Placed", desc: "Order recorded", done: true },
                  { label: "Payment Successful", desc: "Razorpay verified", done: order.payment_status === 'paid' || order.payment_status === 'refunded' },
                  { label: "Cancellation Requested", desc: "Within 1 hour", done: true },
                  { label: "Refund Initiated", desc: order.refund_id ? `ID: ${order.refund_id}` : "Initiated", done: ['processing', 'completed'].includes(order.refund_status) },
                  { label: "Refund Completed", desc: "Settled back to source", done: order.refund_status === 'completed' }
                ];

                return steps.map((step, idx) => (
                  <div key={idx} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center flex-1">
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center border-2 font-bold text-xs transition duration-300 ${
                      step.done
                        ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex flex-col md:items-center">
                      <span className={`text-xs font-black tracking-wide ${step.done ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 max-w-[120px] md:text-center truncate leading-relaxed">
                        {step.desc}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ── Success Banner (Only shown if active) ── */}
        {(order.order_status !== 'cancelled' && order.status !== 'cancelled') && (
          <div className="no-print mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl px-6 py-5 flex items-start gap-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 animate-fade-in">
            <div className="mt-0.5 shrink-0">
              <CheckCircle2 size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-black text-base leading-tight">
                🎉 Order Placed Successfully!
              </p>
              <p className="text-emerald-50 text-xs mt-1 font-medium leading-relaxed">
                Your {productNames ? <strong>{productNames}</strong> : 'item(s)'} {itemsList.length === 1 ? 'has' : 'have'} been confirmed.
                Invoice <span className="font-black font-mono">#{displayOrderId}</span> has been generated below.
              </p>
            </div>
          </div>
        )}

        {/* ── The Invoice Card ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-slate-800/80 shadow-2xl shadow-rose-100/60 dark:shadow-slate-950 overflow-hidden print-sheet">

          {/* Branded top stripe */}
          <div className="print-rose-header h-2 bg-gradient-to-r from-rose-700 via-pink-500 to-rose-600" />

          {/* Brand Header */}
          <div className="px-8 sm:px-12 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start gap-6">
            {/* Left: Brand */}
            <div className="space-y-1.5">
              <h1 className="text-3xl font-bold tracking-widest text-rose-700 dark:text-rose-400 font-serif-luxury uppercase">
                Sõshka
              </h1>
              <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Fine Jewellery</p>
              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-550 leading-relaxed space-y-0.5 pt-1">
                <p>GSTIN: 33AAPCS1182B</p>
                <p>Mufeeda Complex, Kannur, Kerala</p>
                <p className="lowercase">support@soshka.in · www.soshka.in</p>
              </div>
            </div>

            {/* Right: Invoice Meta */}
            <div className="text-left sm:text-right space-y-2">
              <div className="inline-block bg-rose-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                Tax Invoice
              </div>
              <div className="text-[11px] space-y-1">
                <p className="uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Invoice No: <span className="text-rose-600 dark:text-rose-400 font-black font-mono text-sm">#{displayOrderId}</span>
                </p>
                <p className="uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Date: <span className="text-slate-800 dark:text-slate-200 font-bold">{dateStr}</span>
                </p>
                <p className="uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Status:{' '}
                  <span className={`font-bold capitalize ${
                    order.status === 'delivered' ? 'text-emerald-600' :
                    order.status === 'cancelled' ? 'text-red-500' :
                    'text-amber-600 dark:text-amber-400'
                  }`}>
                    {order.status}
                  </span>
                </p>
                <p className="uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Payment: <span className="text-slate-800 dark:text-slate-200 font-bold uppercase">
                    {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid Online'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Client + Shipping Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-8 sm:px-12 py-7 bg-rose-50/40 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                <Mail size={10} /> Bill To
              </p>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{order.shipping_address?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{order.shipping_address?.phone}</p>
              {order.shipping_address?.email && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{order.shipping_address.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                <Truck size={10} /> Ship To
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                {order.shipping_address?.addressLine}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {order.shipping_address?.city}, {order.shipping_address?.state} – <span className="font-bold">{order.shipping_address?.postalCode}</span>
              </p>
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">India</p>
            </div>
          </div>

          {/* AWB Tracking Banner */}
          {order.shiprocket_awb && (
            <div className="mx-8 sm:mx-12 my-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 flex flex-wrap justify-between items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">Dispatched via Shiprocket AWB:</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300">{order.shiprocket_awb}</span>
              </div>
              <a
                href={`https://shiprocket.co/tracking/${order.shiprocket_awb}`}
                target="_blank"
                rel="noopener noreferrer"
                className="no-print flex items-center gap-1 text-rose-600 hover:underline text-[10px] font-bold tracking-wider uppercase"
              >
                <span>Track Package</span>
                <ExternalLink size={10} />
              </a>
            </div>
          )}

          {/* ── Items Table ── */}
          <div className="px-8 sm:px-12 py-6 overflow-x-auto">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Package size={10} /> Order Items
            </p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-rose-600 text-white text-[10px] uppercase tracking-wider font-semibold rounded-xl overflow-hidden">
                  <th className="py-3 px-4 rounded-l-xl font-semibold">Item</th>
                  <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                  <th className="py-3 px-4 font-semibold text-center">Qty</th>
                  <th className="py-3 px-4 rounded-r-xl font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 dark:divide-slate-800/60 text-xs">
                {itemsList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 pr-4 px-4">
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={item.image || ''}
                          alt={item.name}
                          className="h-12 w-12 rounded-xl object-cover border-2 border-rose-100 dark:border-slate-700 shadow-sm"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">{item.name}</p>
                          {item.size && (
                            <span className="text-[9px] font-black uppercase text-rose-400 tracking-wider">Size: {item.size}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-slate-600 dark:text-slate-300">{formatCurrency(item.price)}</td>
                    <td className="py-4 px-4 text-center font-black text-rose-600 dark:text-rose-400">{item.quantity}</td>
                    <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totals & Guarantee ── */}
          <div className="border-t border-slate-100 dark:border-slate-800 px-8 sm:px-12 py-7 flex flex-col sm:flex-row justify-between items-start gap-6">

            {/* Guarantee Stamp */}
            <div className="flex items-center gap-3 border border-rose-200 dark:border-rose-900/30 bg-rose-50/60 dark:bg-rose-900/10 px-4 py-3.5 rounded-2xl">
              <ShieldCheck className="text-rose-600 dark:text-rose-400 h-7 w-7 stroke-[1.5]" />
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest space-y-0.5 leading-snug">
                <p className="text-rose-700 dark:text-rose-400 font-black">Boutique Guarantee</p>
                <p>100% Genuine Handpicked Essentials</p>
              </div>
            </div>

            {/* Summary */}
            <div className="w-full sm:w-72 space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-800 dark:text-white">{formatCurrency(calculatedSubtotal)}</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Shipping</span>
                  <span className="text-slate-800 dark:text-white">{formatCurrency(shippingCost)}</span>
                </div>
              )}
              {order.payment_method === 'cod' && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>COD Handling Fee</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{formatCurrency(order.cod_fee || 60)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-rose-200 dark:border-rose-900/40 pt-3 text-sm font-black text-rose-700 dark:text-rose-400 font-serif-luxury uppercase tracking-wider">
                <span>Grand Total</span>
                <span className="text-lg">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Signature & Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 px-8 sm:px-12 py-7 flex flex-col sm:flex-row justify-between items-center gap-6 bg-rose-50/30 dark:bg-slate-800/10">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <div className="font-mono text-sm tracking-[0.25em] text-rose-200 dark:text-slate-700 select-none">
                ||||| | ||||| | ||| |||| |
              </div>
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Audit Verification Code</span>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-1">
              <div className="h-6 w-36 border-b-2 border-rose-300 dark:border-rose-900 flex items-end justify-center">
                <span className="font-serif-luxury italic text-xs text-rose-500 dark:text-rose-400">Sõshka Team</span>
              </div>
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Authorized Signatory</span>
            </div>
          </div>

          {/* Bottom branded stripe */}
          <div className="print-rose-header h-1.5 bg-gradient-to-r from-rose-700 via-pink-500 to-rose-600" />
        </div>

        {/* Support Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 no-print font-sans-luxury">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
              <Phone size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-white">Customer Support</p>
              <a href="https://wa.me/919496465949" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-emerald-600 hover:underline">
                Message us on WhatsApp
              </a>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-white">Email Assistance</p>
              <a href="mailto:soshka.in@gmail.com" className="text-[10px] font-bold text-rose-600 hover:underline">
                soshka.in@gmail.com
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in font-sans-luxury">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800/80 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6 text-slate-850 dark:text-white relative">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black font-serif-luxury uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Cancel Order?
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure? Your payment will be refunded to your original payment method.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
              >
                Go Back
              </button>
              <button
                onClick={executeCancelOrder}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-md shadow-rose-100 dark:shadow-rose-950/30"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderDetail;
