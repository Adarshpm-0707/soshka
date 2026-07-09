import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { adminLogService } from '../../services/adminLogService';
import { Search, Loader2, Package, Calendar, User, CreditCard, ChevronRight, X, AlertCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/Reusable/Toast';
import ConfirmModal from '../../components/Reusable/ConfirmModal';

const SuperAdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Order Detail Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'cancelled'
  const [timeTick, setTimeTick] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTimeTick(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profile:profiles(email, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching superadmin orders:', err);
      showToast(err.message || 'Error loading orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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
          const data = await res.json();
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


  const handleDeleteOrder = async (orderId) => {
    setDeletingOrder(true);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      // Log the action in admin_logs
      await adminLogService.logAction('deleted_order', 'orders', orderId, {
        total: selectedOrder?.total,
        customer: selectedOrder?.profile?.email || 'N/A'
      });

      showToast('Order deleted successfully', 'success');
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      showToast(err.message || 'Failed to delete order', 'error');
    } finally {
      setDeletingOrder(false);
      setOrderToDelete(null);
    }
  };

  // Filter orders by search query, tab (Active/Cancelled), and status filter
  const filteredOrders = orders.filter((order) => {
    const userEmail = order.profile?.email || '';
    const userName = order.profile?.name || '';
    const orderId = order.id || '';
    const matchesSearch =
      userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orderId.toLowerCase().includes(searchQuery.toLowerCase());

    // 'active' tab = All Orders (including cancelled); 'cancelled' tab = cancelled/failed only
    const matchesTab = activeTab === 'cancelled'
      ? (order.status === 'cancelled' || order.status === 'failed')
      : true;

    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
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
      pending: 'bg-amber-950/20 text-amber-400 border-amber-900',
      paid: 'bg-teal-950/20 text-teal-400 border-teal-900',
      confirmed: 'bg-sky-950/20 text-sky-400 border-sky-900',
      processing: 'bg-blue-950/20 text-blue-400 border-blue-900',
      shipped: 'bg-indigo-950/20 text-indigo-400 border-indigo-900',
      delivered: 'bg-emerald-950/20 text-emerald-400 border-emerald-900',
      cancelled: 'bg-red-950/20 text-red-400 border-red-900',
    };
    return classes[status] || 'bg-slate-900 text-slate-400 border-slate-800';
  };

  return (
    <div className="space-y-6 text-white max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Order Registry</h1>
        <p className="text-slate-450 text-xs mt-1 font-semibold">
          Monitoring center: review global transactions, customer details, and dispatch progress.
        </p>
      </div>

      {/* Active vs Cancelled Tabs */}
      <div className="flex border-b border-[#1c1c1e] mb-6">
        <button
          onClick={() => { setActiveTab('active'); setStatusFilter('all'); }}
          className={`pb-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition ${
            activeTab === 'active'
              ? 'border-[#ff2a85] text-[#ff2a85]'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          All Orders
        </button>
        <button
          onClick={() => { setActiveTab('cancelled'); setStatusFilter('all'); }}
          className={`pb-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition ${
            activeTab === 'cancelled'
              ? 'border-[#ff2a85] text-[#ff2a85]'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Cancelled Orders
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center bg-[#0c0c0d] border border-[#1c1c1e] rounded-2xl px-4 py-3 shadow-sm max-w-md w-full">
          <Search size={18} className="text-slate-500 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search by email, name, or order id..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm w-full outline-none border-none focus:ring-0 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Filter status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-950 border-[#1c1c1e] outline-none text-white"
          >
            {activeTab === 'active' ? (
              <>
                <option value="all">All Orders</option>
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
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-2xl shadow-sm">
          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-400">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-[#0c0c0d] border border-[#1c1c1e] rounded-2xl shadow-sm">
          No orders found matching filters.
        </div>
      ) : (
        <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Customer Email</th>
                  <th className="py-4 px-6">Products</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Grand Total</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1e] text-sm font-semibold">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-white/[0.01] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-mono text-xs text-slate-400 truncate max-w-[200px]" title={order.id}>
                      <div className="flex items-center">
                        <span>{order.id.startsWith('00000000-0000-0000-0000-') ? order.id.split('-').pop() : order.id.slice(0, 8).toUpperCase()}</span>
                        {(() => {
                          const orderTime = new Date(order.created_at).getTime();
                          const diffMins = (Date.now() - orderTime) / (1000 * 60);
                          const remainingMins = Math.max(0, Math.floor(60 - diffMins));
                          const isNew = remainingMins > 0 && order.status !== 'cancelled' && order.status !== 'failed';
                          return isNew ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-[#ff2a85] text-white dark:bg-[#ff2a85]/20 dark:text-pink-400 border border-[#ff2a85]/20 animate-pulse ml-2 shrink-0">
                              ⚡ NEW ({remainingMins}m left)
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-105 font-bold block">{order.profile?.name || 'Anonymous'}</span>
                      <span className="text-[10px] text-slate-500 block font-normal">{order.profile?.email || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1 max-w-[200px]">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="text-xs truncate" title={`${item.name} x ${item.quantity}${item.size ? ` (Size: ${item.size})` : ''}`}>
                            <span className="font-bold text-slate-350">{item.name}</span>
                            {item.size && <span className="text-[9px] bg-slate-900 px-1 py-0.2 rounded border border-[#1c1c1e] ml-1 text-slate-400">{item.size}</span>}
                            <span className="text-slate-500 text-[10px] ml-1">x{item.quantity}</span>
                          </div>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                          <span className="text-xs text-slate-500">No items</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-slate-400 font-bold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-extrabold text-slate-100 block">{formatCurrency(order.total)}</span>
                      <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border mt-1 ${
                        order.payment_method === 'cod'
                          ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900'
                          : 'bg-indigo-950/20 text-indigo-400 border-indigo-900'
                      }`}>
                        {order.payment_method === 'cod' ? 'COD' : 'Prepaid'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center">
                        <ChevronRight size={16} className="text-slate-500" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0d] border border-[#1c1c1e] max-w-2xl w-full rounded-3xl p-6 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-slate-400"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center space-x-2 text-[#ff2a85] mb-1">
                <Package size={20} />
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Order Specifications</span>
              </div>
              <h3 className="text-lg font-black font-mono select-all text-white truncate max-w-[90%]">
                ID: {selectedOrder.id.startsWith('00000000-0000-0000-0000-') ? selectedOrder.id.split('-').pop() : selectedOrder.id.slice(0, 8).toUpperCase()}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Left Column: Customer details + Shipping */}
              <div className="space-y-4">
                <div className="space-y-2 border-b border-[#1c1c1e] pb-3">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center">
                    <User size={12} className="mr-1" /> Customer Info
                  </span>
                  <div className="text-sm font-semibold">
                    <p className="font-extrabold text-white">{selectedOrder.profile?.name || 'Anonymous'}</p>
                    <p className="text-xs text-slate-400">{selectedOrder.profile?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2 border-b border-[#1c1c1e] pb-3">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center">
                    <Calendar size={12} className="mr-1" /> Transaction Date
                  </span>
                  <p className="text-xs font-bold text-slate-400">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center">
                    📍 Shipping Location
                  </span>
                  <div className="text-xs font-semibold text-slate-400 leading-relaxed">
                    <p className="font-bold text-white">{selectedOrder.shipping_address?.name}</p>
                    {selectedOrder.shipping_address?.email && <p className="text-primary-400 font-bold">{selectedOrder.shipping_address.email}</p>}
                    <p>{selectedOrder.shipping_address?.addressLine || selectedOrder.shipping_address?.line1}</p>
                    {selectedOrder.shipping_address?.line2 && <p>{selectedOrder.shipping_address?.line2}</p>}
                    <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.postalCode || selectedOrder.shipping_address?.postal_code}</p>
                    <p>Contact: {selectedOrder.shipping_address?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Status control + totals */}
              <div className="space-y-4 bg-slate-950 border border-[#1c1c1e] p-5 rounded-2xl">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center">
                    🔄 Delivery Status
                  </span>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedOrder.status}
                      disabled={updatingStatus}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-900 border-[#26262a] focus:outline-none text-slate-350"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#1c1c1e]">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center">
                    <CreditCard size={12} className="mr-1" /> Payment Specifications
                  </span>
                  <div className="text-xs font-semibold text-slate-450 space-y-2">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-bold text-white uppercase">{selectedOrder.payment_method || 'Prepaid'}</span>
                    </div>
                    {selectedOrder.payment_method === 'cod' ? (
                      <>
                        <div className="flex justify-between">
                          <span>Items Subtotal:</span>
                          <span className="text-white">{formatCurrency(selectedOrder.subtotal || (selectedOrder.total - 60))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>COD Fee:</span>
                          <span className="text-white">{formatCurrency(selectedOrder.cod_fee || 60)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span>Gateway Code:</span>
                        <span className="font-mono text-white select-all">{selectedOrder.payment_id || 'None'}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-[#1c1c1e] pt-2 text-sm font-extrabold text-white">
                      <span>Grand Total:</span>
                      <span className="text-[#ff2a85] font-black">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Refund Details */}
                {selectedOrder.refund_status && selectedOrder.refund_status !== 'none' && (
                  <div className="space-y-2 pt-2 border-t border-[#1c1c1e]">
                    <span className="text-[10px] uppercase font-extrabold text-slate-550 tracking-wider flex items-center flex-wrap gap-1">
                      💸 Refund Details
                    </span>
                    <div className="text-xs font-semibold text-slate-450 space-y-1">
                      <div className="flex justify-between">
                        <span>Refund Status:</span>
                        <span className={`font-bold uppercase ${
                          selectedOrder.refund_status === 'completed' ? 'text-emerald-450' :
                          selectedOrder.refund_status === 'failed' ? 'text-red-450' :
                          'text-amber-400'
                        }`}>{selectedOrder.refund_status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Refund ID:</span>
                        <span className="font-mono text-white select-all">{selectedOrder.refund_id || 'N/A'}</span>
                      </div>
                      {selectedOrder.refund_amount && (
                        <div className="flex justify-between">
                          <span>Refund Amount:</span>
                          <span className="text-white font-extrabold">{formatCurrency(selectedOrder.refund_amount)}</span>
                        </div>
                      )}
                      {selectedOrder.cancelled_at && (
                        <div className="flex justify-between">
                          <span>Cancelled At:</span>
                          <span className="text-white">{new Date(selectedOrder.cancelled_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOrder.cancellation_reason && (
                        <div className="flex flex-col pt-1">
                          <span className="text-[10px] text-slate-500 font-semibold">Reason:</span>
                          <span className="text-slate-350 italic mt-0.5">{selectedOrder.cancellation_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-[#1c1c1e]">
                  <span className="text-[10px] uppercase font-extrabold text-slate-550 tracking-wider flex items-center">
                    📦 Shiprocket Shipping
                  </span>
                  {selectedOrder.shiprocket_shipment_id ? (
                    <div className="text-xs font-semibold text-slate-450 space-y-1">
                      <div className="flex justify-between">
                        <span>Shipment ID:</span>
                        <span className="text-white font-bold">{selectedOrder.shiprocket_shipment_id}</span>
                      </div>
                      {selectedOrder.shiprocket_awb && (
                        <div className="flex justify-between">
                          <span>AWB Code:</span>
                          <span className="text-white font-mono">{selectedOrder.shiprocket_awb}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-500 font-bold">Not connected to Shiprocket yet</p>
                      <button
                        onClick={async () => {
                          try {
                            showToast('Connecting to Shiprocket...', 'info');
                            const res = await fetch('/api/shiprocket-pickup', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                order: selectedOrder,
                                email: selectedOrder.profile?.email || 'customer@soshka.in'
                              })
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              showToast('Shiprocket pickup scheduled successfully!', 'success');
                              setSelectedOrder(prev => ({
                                ...prev,
                                shiprocket_shipment_id: data.shipment_id,
                                shiprocket_awb: data.awb_code
                              }));
                              fetchOrders();
                            } else {
                              throw new Error(data.error || 'Failed to connect');
                            }
                          } catch (err) {
                            showToast(err.message, 'error');
                          }
                        }}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all"
                      >
                        Schedule Shiprocket Pickup
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
                          const data = await res.json();
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

                <div className="pt-3 border-t border-[#1c1c1e]">
                  <button
                    onClick={() => setOrderToDelete(selectedOrder.id)}
                    disabled={deletingOrder}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl text-xs font-extrabold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingOrder ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    <span>Delete Order Record</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                📦 Purchased Items
              </span>
              <div className="divide-y divide-[#1c1c1e] bg-slate-950 border border-[#1c1c1e] rounded-2xl overflow-hidden text-xs font-semibold">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3">
                    <div className="flex items-center space-x-3 max-w-[70%]">
                      <img
                        src={item.image || ''}
                        alt={item.name}
                        className="h-10 w-10 rounded-lg object-cover border border-[#1c1c1e] bg-slate-900"
                      />
                      <div>
                        <span className="font-extrabold text-slate-200 block line-clamp-1">{item.name}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{formatCurrency(item.price)} x {item.quantity}</span>
                          {item.size && (
                            <span className="px-1 py-0.5 text-[8px] font-black rounded bg-slate-900 text-slate-400 border border-[#1c1c1e]">
                              Size: {item.size}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-white">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Confirm Modal */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => handleDeleteOrder(orderToDelete)}
        title="Delete Order Record?"
        message="Are you sure you want to permanently delete this order record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep Order"
        type="danger"
        isLoading={deletingOrder}
      />
    </div>
  );
};

export default SuperAdminOrdersPage;