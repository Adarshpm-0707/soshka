import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Loader2, Package, Calendar, User, CreditCard, ChevronRight, X, AlertCircle, Trash2, MapPin, Phone, Mail, ExternalLink, Truck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/Reusable/Toast';
import { adminLogService } from '../../services/adminLogService';
import { shiprocketService } from '../../services/shiprocketService';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Order Detail Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'cancelled'
  const [timeTick, setTimeTick] = useState(Date.now());
  const autoDispatchedRef = useRef(new Set());

  useEffect(() => {
    const interval = setInterval(() => setTimeTick(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const autoDispatchNewOrders = (orderList) => {
    orderList.forEach((order) => {
      const email = (order.profile?.email || order.shipping_address?.email || '').toLowerCase();
      const name = (order.profile?.name || order.shipping_address?.name || '').toLowerCase();
      const orderIdStr = String(order.id || '').toLowerCase();

      const isTestOrder =
        email.includes('test@') ||
        email.includes('example.com') ||
        name.includes('test customer') ||
        orderIdStr.includes('test');

      if (isTestOrder) return;

      const isEligible = (order.status === 'confirmed' || order.status === 'paid' || order.status === 'processing') && !order.shiprocket_shipment_id;
      if (isEligible && !autoDispatchedRef.current.has(order.id)) {
        autoDispatchedRef.current.add(order.id);
        console.log(`[Auto-Shiprocket] Auto-dispatching new incoming order ${order.id}...`);
        shiprocketService.dispatchOrder(order)
          .then(async (res) => {
            if (res && res.success) {
              console.log(`[Auto-Shiprocket] Successfully dispatched order ${order.id}`);
              showToast(`🚚 Order #${order.id.startsWith('00000000-0000-0000-0000-') ? order.id.split('-').pop() : order.id.slice(0, 8).toUpperCase()} auto-dispatched to Shiprocket!`, 'success');
              const { data: updatedData } = await supabase
                .from('orders')
                .select('*, profile:profiles(email, name)')
                .order('created_at', { ascending: false });
              if (updatedData) setOrders(updatedData);
            }
          })
          .catch((err) => console.warn(`[Auto-Shiprocket Error] Order ${order.id}:`, err));
      }
    });
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profile:profiles(email, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const orderList = data || [];
      setOrders(orderList);
      autoDispatchNewOrders(orderList);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      showToast(err.message || 'Error loading orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time order updates
    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;

      // Log the action in admin_logs
      await adminLogService.logAction('updated_order_status', 'orders', orderId, { status: newStatus });

      showToast(`Order status updated to ${newStatus}`, 'success');

      // Auto-send cancellation email when order is cancelled
      if (newStatus === 'cancelled') {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const res = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ order_id: orderId, email_type: 'cancellation' })
          });
          const contentType = res.headers.get('content-type') || '';
          const data = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
          if (res.ok && data.success) {
            showToast(`Cancellation email sent to ${data.sent_to} ✉️`, 'success');
          } else {
            console.warn('Cancellation email failed:', data.error);
            showToast('Status updated but cancellation email failed', 'warning');
          }
        } catch (emailErr) {
          console.warn('Cancellation email error:', emailErr);
        }
      }
      
      // Update selected order modal detail state inline
      setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null));
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };




  // Filter orders by search query, tab (Active/Cancelled), and status filter
  const filteredOrders = orders.filter((order) => {
    const isGuestOrder = !order.user_id || !order.profile || !order.profile?.email;
    const userEmail = order.profile?.email || order.shipping_address?.email || '';
    const userName = order.profile?.name || order.shipping_address?.name || 'Guest User';
    const orderId = order.id || '';
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      userEmail.toLowerCase().includes(query) ||
      userName.toLowerCase().includes(query) ||
      orderId.toLowerCase().includes(query) ||
      (query.includes('guest') && isGuestOrder);

    // 'active' tab = All Orders (including cancelled); 'cancelled' tab = cancelled/failed only
    const matchesTab = activeTab === 'cancelled'
      ? (order.status === 'cancelled' || order.status === 'failed')
      : true;

    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'guest') {
      matchesStatus = isGuestOrder;
    } else if (statusFilter === 'refund_pending') {
      matchesStatus = order.refund_status === 'processing';
    } else if (statusFilter === 'refund_completed') {
      matchesStatus = order.refund_status === 'completed';
    } else if (statusFilter === 'refund_failed') {
      matchesStatus = order.refund_status === 'failed';
    } else {
      matchesStatus = (order.order_status || order.status) === statusFilter;
    }

    return matchesSearch && matchesTab && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900',
      processing: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-900',
      shipped: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
      delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
      cancelled: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900',
    };
    return classes[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-white max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Orders Registry</h1>
        <p className="text-slate-550 dark:text-slate-450 text-sm mt-1">
          Monitor transactions, check buyer details, and update shipping progress.
        </p>
      </div>

      {/* Active vs Cancelled Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => { setActiveTab('active'); setStatusFilter('all'); }}
          className={`pb-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition ${
            activeTab === 'active'
              ? 'border-primary-600 text-primary-600 dark:border-[#ff2a85] dark:text-[#ff2a85]'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => { setActiveTab('cancelled'); setStatusFilter('all'); }}
          className={`pb-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition ${
            activeTab === 'cancelled'
              ? 'border-primary-600 text-primary-600 dark:border-[#ff2a85] dark:text-[#ff2a85]'
              : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Cancelled Orders
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 shadow-sm max-w-md w-full">
          <Search size={18} className="text-slate-450 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search by email, name, order id, or 'guest'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm w-full outline-none border-none focus:ring-0"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-450 uppercase">Filter status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 outline-none"
          >
            {activeTab === 'active' ? (
              <>
                <option value="all">All Orders</option>
                <option value="guest">Guest Orders Only 👤</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
                <option value="refund_pending">Refund Pending</option>
                <option value="refund_completed">Refund Completed</option>
                <option value="refund_failed">Refund Failed</option>
              </>
            ) : (
              <>
                <option value="all">All Cancelled</option>
                <option value="guest">Guest Orders Only 👤</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
                <option value="refund_pending">Refund Pending</option>
                <option value="refund_completed">Refund Completed</option>
                <option value="refund_failed">Refund Failed</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-450">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center text-slate-450 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          No orders found matching filters.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Customer / Guest</th>
                  <th className="py-4 px-6">Products</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Grand Total</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm font-semibold">
                {filteredOrders.map((order) => {
                  const isGuestOrder = !order.user_id || !order.profile || !order.profile?.email;
                  const customerName = order.profile?.name || order.shipping_address?.name || 'Guest User';
                  const customerEmail = order.profile?.email || order.shipping_address?.email || 'N/A';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono text-xs text-slate-500 truncate max-w-[200px]" title={order.id}>
                        <div className="flex items-center">
                          <span>{order.id.startsWith('00000000-0000-0000-0000-') ? order.id.split('-').pop() : order.id.slice(0, 8).toUpperCase()}</span>
                          {(() => {
                            const orderTime = new Date(order.created_at).getTime();
                            const diffMins = (Date.now() - orderTime) / (1000 * 60);
                            const remainingMins = Math.max(0, Math.floor(60 - diffMins));
                            const isNew = remainingMins > 0 && order.status !== 'cancelled' && order.status !== 'failed';
                            return isNew ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-pink-600 text-white dark:bg-pink-600/20 dark:text-pink-400 border border-pink-500/20 animate-pulse ml-2 shrink-0">
                                ⚡ NEW ({remainingMins}m left)
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-slate-800 dark:text-slate-100 font-bold">{customerName}</span>
                          {isGuestOrder && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-pink-500/10 text-[#ff2a85] border border-pink-500/20 rounded-md shrink-0">
                              Guest
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-450 block font-normal">{customerEmail}</span>
                      </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1 max-w-[200px]">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="text-xs truncate" title={`${item.name} x ${item.quantity}${item.size ? ` (Size: ${item.size})` : ''}`}>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                            {item.size && <span className="text-[9px] bg-slate-100 dark:bg-slate-850 px-1 py-0.2 rounded border border-slate-200/50 dark:border-slate-800 ml-1 text-slate-500">{item.size}</span>}
                            <span className="text-slate-450 text-[10px] ml-1">x{item.quantity}</span>
                          </div>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                          <span className="text-xs text-slate-400">No items</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-slate-500 font-bold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center">
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 max-w-2xl w-full rounded-3xl p-6 shadow-2xl space-y-6 text-slate-800 dark:text-white max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 text-primary-600 dark:text-[#ff2a85] mb-1">
                <Package size={20} />
                <span className="text-xs uppercase font-extrabold tracking-widest">Order Specifications</span>
              </div>
              <h3 className="text-lg font-black font-mono select-all text-slate-905 dark:text-white truncate max-w-[90%]">
                ID: {selectedOrder.id.startsWith('00000000-0000-0000-0000-') ? selectedOrder.id.split('-').pop() : selectedOrder.id.slice(0, 8).toUpperCase()}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Left Column: Customer details + Shipping */}
              <div className="space-y-4">
                <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center justify-between">
                    <span className="flex items-center"><User size={12} className="mr-1" /> Customer Info</span>
                    {(!selectedOrder.user_id || !selectedOrder.profile?.email) && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-pink-500/10 text-[#ff2a85] border border-pink-500/20 rounded-full">
                        Guest Order
                      </span>
                    )}
                  </span>
                  <div className="text-sm font-semibold">
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {selectedOrder.profile?.name || selectedOrder.shipping_address?.name || 'Guest User'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedOrder.profile?.email || selectedOrder.shipping_address?.email || 'N/A'}
                    </p>
                    {(!selectedOrder.user_id || !selectedOrder.profile?.email) && (
                      <div className="mt-1.5 p-2 bg-pink-500/5 border border-pink-500/15 rounded-xl text-[10px] text-[#ff2a85] font-extrabold flex items-center gap-1.5">
                        <span>🛍️ Customer purchased this order as a Guest</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center">
                    <Calendar size={12} className="mr-1" /> Transaction Date
                  </span>
                  <p className="text-xs font-bold text-slate-500">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center">
                    <MapPin size={12} className="mr-1 text-primary-500" /> Shipping Destination Address
                  </span>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs space-y-1.5">
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {selectedOrder.shipping_address?.name || selectedOrder.profile?.name || 'Customer Name N/A'}
                    </p>

                    {(selectedOrder.shipping_address?.email || selectedOrder.profile?.email) && (
                      <p className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1.5">
                        <Mail size={11} className="shrink-0" />
                        <a href={`mailto:${selectedOrder.shipping_address?.email || selectedOrder.profile?.email}`} className="hover:underline">
                          {selectedOrder.shipping_address?.email || selectedOrder.profile?.email}
                        </a>
                      </p>
                    )}

                    {selectedOrder.shipping_address?.phone && (
                      <p className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                        <Phone size={11} className="shrink-0 text-emerald-500" />
                        <a href={`tel:${selectedOrder.shipping_address.phone}`} className="hover:underline">
                          {selectedOrder.shipping_address.phone}
                        </a>
                      </p>
                    )}

                    <div className="text-slate-600 dark:text-slate-300 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 leading-relaxed">
                      <p>{selectedOrder.shipping_address?.addressLine || selectedOrder.shipping_address?.line1 || selectedOrder.shipping_address?.address || 'Street Address N/A'}</p>
                      {selectedOrder.shipping_address?.line2 && <p>{selectedOrder.shipping_address.line2}</p>}
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {[
                          selectedOrder.shipping_address?.city,
                          selectedOrder.shipping_address?.state,
                          selectedOrder.shipping_address?.postalCode || selectedOrder.shipping_address?.postal_code || selectedOrder.shipping_address?.pincode
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Status control + totals */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center">
                    🔄 Delivery Status
                  </span>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedOrder.status}
                      disabled={updatingStatus}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center">
                    <CreditCard size={12} className="mr-1" /> Payment Specifications
                  </span>
                  <div className="text-xs font-semibold text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Gateway Code:</span>
                      <span className="font-mono text-slate-850 dark:text-white select-all">{selectedOrder.payment_id || 'Cash on Delivery / None'}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-850 pt-2 text-sm font-extrabold text-slate-800 dark:text-white">
                      <span>Grand Total:</span>
                      <span className="text-[#ff2a85] font-black">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Refund Details */}
                {selectedOrder.refund_status && selectedOrder.refund_status !== 'none' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center flex-wrap gap-1">
                      💸 Refund Details
                    </span>
                    <div className="text-xs font-semibold text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Refund Status:</span>
                        <span className={`font-bold uppercase ${
                          selectedOrder.refund_status === 'completed' ? 'text-emerald-600' :
                          selectedOrder.refund_status === 'failed' ? 'text-red-500' :
                          'text-amber-600 dark:text-amber-400'
                        }`}>{selectedOrder.refund_status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Refund ID:</span>
                        <span className="font-mono text-slate-850 dark:text-white select-all">{selectedOrder.refund_id || 'N/A'}</span>
                      </div>
                      {selectedOrder.refund_amount && (
                        <div className="flex justify-between">
                          <span>Refund Amount:</span>
                          <span className="text-slate-850 dark:text-white font-extrabold">{formatCurrency(selectedOrder.refund_amount)}</span>
                        </div>
                      )}
                      {selectedOrder.cancelled_at && (
                        <div className="flex justify-between">
                          <span>Cancelled At:</span>
                          <span className="text-slate-850 dark:text-white">{new Date(selectedOrder.cancelled_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOrder.cancellation_reason && (
                        <div className="flex flex-col pt-1">
                          <span className="text-[10px] text-slate-450">Reason:</span>
                          <span className="text-slate-700 dark:text-slate-350 italic mt-0.5">{selectedOrder.cancellation_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center justify-between">
                    <span className="flex items-center"><Truck size={12} className="mr-1 text-emerald-500" /> Shiprocket Logistics</span>
                    {selectedOrder.shiprocket_shipment_id && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                        Connected
                      </span>
                    )}
                  </span>
                  {selectedOrder.shiprocket_shipment_id ? (
                    <div className="text-xs font-semibold text-slate-500 space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Shipment ID:</span>
                        <span className="text-slate-800 dark:text-white font-bold font-mono bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {selectedOrder.shiprocket_shipment_id}
                        </span>
                      </div>
                      {selectedOrder.shiprocket_awb ? (
                        <div className="flex justify-between items-center">
                          <span>AWB Code:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                            {selectedOrder.shiprocket_awb}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span>AWB Status:</span>
                          <span className="text-amber-500 font-semibold text-[10px]">Pending Wallet Recharge</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[10px]">
                        <span>Pickup Location:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">warehouse</span>
                      </div>

                      {selectedOrder.shiprocket_awb && (
                        <a
                          href={`https://shiprocket.co/tracking/${selectedOrder.shiprocket_awb}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm"
                        >
                          <span>Track Order on Shiprocket</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-500 font-bold">Not connected to Shiprocket yet</p>
                      <button
                        onClick={async () => {
                          try {
                            showToast('Connecting to Shiprocket...', 'info');
                            const res = await shiprocketService.dispatchOrder(selectedOrder);
                            if (res.success) {
                              if (res.warning) {
                                showToast(`Order created in Shiprocket! ⚠️ ${res.warning}`, 'warning');
                              } else {
                                showToast('Shiprocket pickup scheduled successfully! 🚚', 'success');
                              }
                              setSelectedOrder(prev => ({
                                ...prev,
                                shiprocket_shipment_id: res.shipment_id,
                                shiprocket_awb: res.awb_code
                              }));
                              fetchOrders();
                            }
                          } catch (err) {
                            console.error('Shiprocket error:', err);
                            showToast(err.message || 'Shiprocket pickup scheduling failed', 'error');
                          }
                        }}
                        className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all active:scale-95"
                      >
                        <span>Schedule Shiprocket Pickup</span>
                      </button>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <button
                      onClick={async () => {
                        try {
                          showToast('Resending invoice email...', 'info');
                          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
                          const res = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${supabaseKey}`,
                            },
                            body: JSON.stringify({ order_id: selectedOrder.id })
                          });
                          const contentType = res.headers.get('content-type') || '';
                          const data = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
                          if (res.ok && data.success) {
                            showToast(`Invoice email sent to ${data.sent_to} ✉️`, 'success');
                          } else {
                            throw new Error(data.error || 'Failed to send email');
                          }
                        } catch (err) {
                          showToast(err.message || 'Email send failed', 'error');
                        }
                      }}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-extrabold transition-all"
                    >
                      Resend Invoice Email
                    </button>
                  </div>
                </div>


              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                📦 Purchased Items
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden text-xs font-semibold">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3">
                    <div className="flex items-center space-x-3 max-w-[70%]">
                      <img
                        src={item.image || ''}
                        alt={item.name}
                        className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-850"
                      />
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 block line-clamp-1">{item.name}</span>
                        <span className="text-[10px] text-slate-450 flex items-center gap-1.5 mt-0.5">
                          <span>{formatCurrency(item.price)} x {item.quantity}</span>
                          {item.size && (
                            <span className="px-1 py-0.5 text-[8px] font-black rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                              Size: {item.size}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
