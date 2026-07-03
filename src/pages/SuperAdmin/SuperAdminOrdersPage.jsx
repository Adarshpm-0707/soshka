import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { adminLogService } from '../../services/adminLogService';
import { Search, Loader2, Package, Calendar, User, CreditCard, ChevronRight, X, AlertCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/Reusable/Toast';

const SuperAdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Order Detail Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

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
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

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
    }
  };

  // Filter orders by search query (email, name, or order id) and status filter
  const filteredOrders = orders.filter((order) => {
    const userEmail = order.profile?.email || '';
    const userName = order.profile?.name || '';
    const orderId = order.id || '';
    const matchesSearch =
      userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orderId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-amber-950/20 text-amber-400 border-amber-900',
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
            className="px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-950 border-[#1c1c1e] outline-none"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
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
                    <td className="py-4 px-6 font-mono text-xs text-slate-400 truncate max-w-[120px]" title={order.id}>
                      {order.id}
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
                      <span className="font-extrabold text-slate-100">{formatCurrency(order.total)}</span>
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
                ID: {selectedOrder.id}
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
                  <div className="text-xs font-semibold text-slate-450 space-y-1">
                    <div className="flex justify-between">
                      <span>Gateway Code:</span>
                      <span className="font-mono text-white select-all">{selectedOrder.payment_id || 'Cash on Delivery / None'}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#1c1c1e] pt-2 text-sm font-extrabold text-white">
                      <span>Grand Total:</span>
                      <span className="text-[#ff2a85] font-black">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

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
                          const res = await fetch('/api/send-order-confirmation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              order: selectedOrder,
                              email: selectedOrder.shipping_address?.email || selectedOrder.profile?.email
                            })
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            showToast('Invoice email sent successfully!', 'success');
                          } else {
                            throw new Error(data.error || 'Failed to send email');
                          }
                        } catch (err) {
                          showToast(err.message, 'error');
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
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
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
    </div>
  );
};

export default SuperAdminOrdersPage;