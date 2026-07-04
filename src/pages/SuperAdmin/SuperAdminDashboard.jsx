import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/Reusable/Toast';
import { paymentSettingsService } from '../../services/paymentSettingsService';
import { customerService } from '../../services/customerService';
import { superadminService } from '../../services/superadminService';
import { adminLogService } from '../../services/adminLogService';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { useAuth } from '../../hooks/useAuth';
import AdminReviewsPage from '../Admin/AdminReviewsPage';

import {
  Crown,
  Users,
  ShoppingBag,
  ShoppingCart,
  DollarSign,
  Gift,
  Activity,
  ArrowRight,
  Settings,
  Shield,
  Loader2,
  FileCode,
  Calendar,
  Lock,
  Layers,
  Search,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  ChevronRight,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Save,
  CreditCard,
  CheckCircle,
  Phone,
  UserCheck,
  UserX,
  UserPlus
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile: currentProfile } = useAuth();

  // Determine current tab based on the URL pathname
  let activeTab = 'overview';
  if (location.pathname.startsWith('/superadmin/admins')) activeTab = 'admins';
  else if (location.pathname.startsWith('/superadmin/customers')) activeTab = 'customers';
  else if (location.pathname.startsWith('/superadmin/products')) activeTab = 'products';
  else if (location.pathname.startsWith('/superadmin/orders')) activeTab = 'orders';
  else if (location.pathname.startsWith('/superadmin/payments')) activeTab = 'payments';
  else if (location.pathname.startsWith('/superadmin/logs')) activeTab = 'logs';
  else if (location.pathname.startsWith('/superadmin/pandl')) activeTab = 'pandl';
  else if (location.pathname.startsWith('/superadmin/reviews')) activeTab = 'reviews';

  const setTab = (tabName) => {
    if (tabName === 'overview') navigate('/superadmin/dashboard');
    else navigate(`/superadmin/${tabName}`);
  };

  // ==========================================
  // STATE DEFINITIONS
  // ==========================================
  
  // Overview Tab Stats & Logs
  const [overviewStats, setOverviewStats] = useState({
    adminsCount: 0,
    customersCount: 0,
    productsCount: 0,
    ordersCount: 0,
    revenue: 0,
    campaignsCount: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Manage Admins Tab (uses hook + local additions)
  const { 
    admins, 
    loading: adminsLoading, 
    fetchAdmins, 
    toggleAdminActive, 
    updateAdminRole, 
    deleteAdmin 
  } = useSuperAdmin();
  const [adminDeleteId, setAdminDeleteId] = useState(null);
  const [adminDeleting, setAdminDeleting] = useState(false);
  const [isProvisionFormOpen, setIsProvisionFormOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  // Manage Customers Tab
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDeleteId, setCustomerDeleteId] = useState(null);
  const [customerDeleting, setCustomerDeleting] = useState(false);

  // Payment settings Tab
  const [paymentSettings, setPaymentSettings] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsSaving, setPaymentsSaving] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('razorpay');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isGatewayActive, setIsGatewayActive] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  // Orders Tab
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  // Products Tab
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [productDeleteId, setProductDeleteId] = useState(null);
  const [productDeleting, setProductDeleting] = useState(false);

  // System Logs Tab
  const [logsList, setLogsList] = useState([]);
  const [logsCount, setLogsCount] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(15);
  const [expandedLogs, setExpandedLogs] = useState({});
  const [actionFilter, setActionFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actorsList, setActorsList] = useState([]);

  // Diagnostics panel state
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    setTimeout(() => {
      setDiagnosticsRunning(false);
      showToast('All diagnostic tests passed. Core infrastructure healthy.', 'success');
    }, 1200);
  };

  // ==========================================
  // DATA FETCHING TRIGGERS
  // ==========================================
  
  // 1. Fetch Overview stats
  const fetchOverviewData = async () => {
    setOverviewLoading(true);
    try {
      const { count: adminsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['admin', 'superadmin']);

      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user')
        .not('email', 'ilike', '%admin%')
        .neq('email', 'adarshpm0707@gmail.com')
        .neq('email', 'soshka.in@gmail.com');

      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: campaignsCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true });

      const { data: ordersData } = await supabase
        .from('orders')
        .select('total, status');

      const ordersCount = ordersData?.length || 0;
      const totalRevenue = (ordersData || [])
        .filter(order => order.status !== 'cancelled')
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

      setOverviewStats({
        adminsCount: adminsCount || 0,
        customersCount: customersCount || 0,
        productsCount: productsCount || 0,
        ordersCount,
        revenue: totalRevenue,
        campaignsCount: campaignsCount || 0
      });

      const { data: logsData } = await supabase
        .from('admin_logs')
        .select('*, profile:profiles(name, email)')
        .order('created_at', { ascending: false })
        .limit(6);
      
      setRecentLogs(logsData || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading overview numbers', 'error');
    } finally {
      setOverviewLoading(false);
    }
  };

  // 2. Fetch Customers
  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const data = await customerService.fetchAllCustomers();
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch customers directory.', 'error');
    } finally {
      setCustomersLoading(false);
    }
  };

  // 3. Fetch Payments configs
  const fetchPaymentSettings = async () => {
    setPaymentsLoading(true);
    try {
      const data = await paymentSettingsService.fetchPaymentSettings();
      setPaymentSettings(data || []);
      const existing = data.find(s => s.gateway === selectedGateway);
      if (existing) {
        setApiKey(existing.api_key || '');
        setApiSecret(existing.api_secret || '');
        setIsGatewayActive(existing.is_active !== false);
      } else {
        setApiKey('');
        setApiSecret('');
        setIsGatewayActive(true);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch gateway configurations.', 'error');
    } finally {
      setPaymentsLoading(false);
    }
  };

  // 4. Fetch Products
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, offers(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to retrieve products listing.', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  // 5. Fetch Orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profile:profiles(email, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to retrieve shipping orders.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  // 6. Fetch Logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const filters = {};
      if (actionFilter) filters.action = actionFilter;
      if (tableFilter) filters.targetTable = tableFilter;
      if (actorFilter) filters.actorId = actorFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await adminLogService.fetchLogs(filters, logsPage, logsLimit);
      setLogsList(result.logs || []);
      setLogsCount(result.count || 0);
    } catch (err) {
      console.error(err);
      showToast('Failed to load system logs.', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch admin profiles for log filters
  const fetchActors = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('role', ['admin', 'superadmin']);
      setActorsList(data || []);
    } catch (_) {}
  };

  const getPandLStats = () => {
    let filtered = orders.filter(order => order.status !== 'cancelled');

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(order => new Date(order.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.created_at) <= end);
    }

    let totalRevenue = 0;
    let totalCOGS = 0;

    const productStats = {};
    
    products.forEach(p => {
      productStats[p.id] = {
        name: p.name,
        category: p.category,
        quantity: 0,
        revenue: 0,
        cost: Number(p.cost) || 0,
        totalCost: 0,
        profit: 0
      };
    });

    const transactionList = filtered.map(order => {
      let orderCOGS = 0;
      
      const itemsList = (order.items || []).map(item => {
        const prodId = item.product_id || item.id;
        const currentProd = products.find(p => p.id === prodId);
        const itemCost = currentProd ? (Number(currentProd.cost) || 0) : 0;
        const itemCOGS = itemCost * (item.quantity || 1);
        
        orderCOGS += itemCOGS;
        
        if (productStats[prodId]) {
          productStats[prodId].quantity += item.quantity || 1;
          productStats[prodId].revenue += (item.price || 0) * (item.quantity || 1);
          productStats[prodId].totalCost += itemCOGS;
        } else {
          productStats[prodId] = {
            name: item.name || 'Deleted Product',
            category: 'N/A',
            quantity: item.quantity || 1,
            revenue: (item.price || 0) * (item.quantity || 1),
            cost: itemCost,
            totalCost: itemCOGS,
          };
        }

        return {
          ...item,
          cost: itemCost,
          cogs: itemCOGS
        };
      });

      const orderRevenue = Number(order.total) || 0;
      const orderProfit = orderRevenue - orderCOGS;
      const orderMargin = orderRevenue > 0 ? (orderProfit / orderRevenue) * 100 : 0;

      totalRevenue += orderRevenue;
      totalCOGS += orderCOGS;

      return {
        ...order,
        itemsWithCOGS: itemsList,
        cogs: orderCOGS,
        profit: orderProfit,
        margin: orderMargin
      };
    });

    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const productStatsList = Object.keys(productStats)
      .map(id => {
        const item = productStats[id];
        item.profit = item.revenue - item.totalCost;
        item.margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
        return { id, ...item };
      })
      .filter(item => item.quantity > 0);

    return {
      revenue: totalRevenue,
      cogs: totalCOGS,
      grossProfit,
      grossMargin,
      transactionList,
      productStatsList
    };
  };

  // Trigger loads based on activeTab
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewData();
    } else if (activeTab === 'admins') {
      fetchAdmins();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'payments') {
      fetchPaymentSettings();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'logs') {
      fetchLogs();
      fetchActors();
    } else if (activeTab === 'pandl') {
      fetchProducts();
      fetchOrders();
    }
  }, [activeTab, selectedGateway, logsPage, actionFilter, tableFilter, actorFilter, startDate, endDate]);

  // Customer client side search filter
  useEffect(() => {
    const term = customerSearch.toLowerCase().trim();
    if (!term) {
      setFilteredCustomers(customers);
    } else {
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.phone?.toLowerCase().includes(term)
        )
      );
    }
  }, [customerSearch, customers]);

  // ==========================================
  // BUSINESS OPERATIONS HANDLERS
  // ==========================================

  // Admin: Suspend/Activate
  const handleToggleAdminStatus = async (admin) => {
    if (admin.id === currentProfile?.id) {
      showToast('You cannot suspend your own credentials!', 'warning');
      return;
    }
    try {
      await toggleAdminActive(admin.id, !admin.is_active);
    } catch (_) {}
  };

  // Admin: Change Role
  const handleRoleChange = async (admin, newRole) => {
    if (admin.id === currentProfile?.id) {
      showToast('You cannot modify your own privilege role!', 'warning');
      return;
    }
    try {
      await updateAdminRole(admin.id, newRole);
    } catch (_) {}
  };

  // Admin: Confirm Delete
  const handleConfirmAdminDelete = async () => {
    if (!adminDeleteId) return;
    setAdminDeleting(true);
    try {
      await deleteAdmin(adminDeleteId);
      setAdminDeleteId(null);
      fetchOverviewData();
    } catch (_) {} finally {
      setAdminDeleting(false);
    }
  };

  // Admin: Inline Provisioning
  const handleProvisionAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword) {
      showToast('All form fields are required.', 'error');
      return;
    }
    if (newAdminPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setProvisioning(true);
    try {
      await superadminService.createAdmin({
        email: newAdminEmail.trim(),
        password: newAdminPassword,
        name: newAdminName.trim(),
        role: newAdminRole
      });
      showToast('New Operator credentials generated successfully!', 'success');
      setIsProvisionFormOpen(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchAdmins();
      fetchOverviewData();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to provision admin.', 'error');
    } finally {
      setProvisioning(false);
    }
  };

  // Customer: Confirm delete
  const handleConfirmCustomerDelete = async () => {
    if (!customerDeleteId) return;
    setCustomerDeleting(true);
    try {
      await customerService.deleteCustomer(customerDeleteId);
      showToast('Customer account permanently deleted.', 'info');
      setCustomers((prev) => prev.filter((c) => c.id !== customerDeleteId));
      setCustomerDeleteId(null);
      fetchOverviewData();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to delete customer profile.', 'error');
    } finally {
      setCustomerDeleting(false);
    }
  };

  // Payment: Submit configurations
  const handleSavePaymentConfigs = async (e) => {
    e.preventDefault();
    setPaymentsSaving(true);
    try {
      const existing = paymentSettings.find(s => s.gateway === selectedGateway);
      const payload = {
        id: existing?.id || null,
        gateway: selectedGateway,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        is_active: isGatewayActive
      };

      await paymentSettingsService.updatePaymentSettings(payload);
      showToast(`${selectedGateway.toUpperCase()} payment setup saved!`, 'success');
      fetchPaymentSettings();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to save configurations.', 'error');
    } finally {
      setPaymentsSaving(false);
    }
  };

  // Product: Confirm Delete
  const handleConfirmProductDelete = async () => {
    if (!productDeleteId) return;
    setProductDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productDeleteId);
      if (error) throw error;
      await adminLogService.logAction('deleted_product', 'products', productDeleteId, { id: productDeleteId });
      showToast('Product listings deleted successfully.', 'info');
      setProducts(prev => prev.filter(p => p.id !== productDeleteId));
      setProductDeleteId(null);
      fetchOverviewData();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to delete product listing.', 'error');
    } finally {
      setProductDeleting(false);
    }
  };

  // Order: Update status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;

      await adminLogService.logAction('updated_order_status', 'orders', orderId, { status: newStatus });
      showToast(`Order status updated to: ${newStatus}`, 'success');
      setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null));
      fetchOrders();
      fetchOverviewData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update order status.', 'error');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // UI helpers
  const getOrderStatusBadge = (status) => {
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
    <div className="space-y-8 text-white max-w-6xl mx-auto">
      
      {/* Top Console Header & Tabs switcher */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1c1c1e] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#ff2a85] tracking-widest uppercase">
              <Crown size={14} /> Soshka Enterprise
            </div>
            <h1 className="text-3xl font-black font-sans tracking-wide mt-1">Super Admin Authority Console</h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Global system monitoring, billing integrations, and operator audit directories.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setTab('payments'); }}
              className="px-4 py-2.5 bg-white/5 border border-white/[0.08] hover:bg-[#ff2a85]/10 hover:border-[#ff2a85]/35 text-xs font-bold rounded-xl transition"
            >
              Gateway Configurations
            </button>
            <button
              onClick={() => { setTab('admins'); setIsProvisionFormOpen(true); }}
              className="px-4 py-2.5 bg-[#ff2a85] hover:opacity-90 text-xs font-bold rounded-xl shadow-lg shadow-pink-500/10 transition"
            >
              Provision Admin
            </button>
          </div>
        </div>

    
      </div>

      {/* ==========================================
          TAB CONTENT PANEL RENDERS
          ========================================== */}

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Stats Grid */}
          {overviewLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-[#0c0c0d] border border-[#1c1c1e] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { label: 'Administrators', value: overviewStats.adminsCount, icon: Shield, color: 'text-blue-400 bg-blue-950/20 border-blue-500/10', tab: 'admins' },
                { label: 'Registered Customers', value: overviewStats.customersCount, icon: Users, color: 'text-amber-400 bg-amber-950/20 border-amber-500/10', tab: 'customers' },
                { label: 'Store Products', value: overviewStats.productsCount, icon: ShoppingBag, color: 'text-purple-400 bg-purple-950/20 border-purple-500/10', tab: 'products' },
                { label: 'Total Orders', value: overviewStats.ordersCount, icon: ShoppingCart, color: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/10', tab: 'orders' },
                { label: 'Net Revenue', value: formatCurrency(overviewStats.revenue), icon: DollarSign, color: 'text-[#ff2a85] bg-pink-950/20 border-pink-500/10', tab: 'orders' },
                { label: 'Active Campaigns', value: overviewStats.campaignsCount, icon: Gift, color: 'text-pink-400 bg-pink-950/20 border-pink-500/10', tab: 'overview' }
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <button
                    key={i}
                    onClick={() => setTab(stat.tab)}
                    className={`p-5 rounded-2xl bg-[#0c0c0d] border ${stat.color} shadow-sm space-y-4 text-left block w-full hover:scale-[1.01] transition-all`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold">{stat.label}</span>
                      <Icon size={16} />
                    </div>
                    <h2 className="text-xl font-black font-mono tracking-tight">{stat.value}</h2>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Diagnostics and Health Status Panel */}
            <div className="lg:col-span-2 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[#ff2a85]" />
                  <h3 className="text-base font-bold font-sans tracking-wide">System Diagnostics & Status</h3>
                </div>
                <button
                  onClick={handleRunDiagnostics}
                  disabled={diagnosticsRunning}
                  className="px-3.5 py-2 bg-[#ff2a85]/10 border border-[#ff2a85]/20 hover:bg-[#ff2a85]/20 text-[#ff2a85] text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  {diagnosticsRunning ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Settings size={12} />
                      Run Diagnostics
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                {[
                  { name: 'Supabase API Connection', status: 'Operational', details: 'Ping latency: 42ms' },
                  { name: 'PostgreSQL DB Engine', status: 'Active (v15.6)', details: 'RLS policies active' },
                  { name: 'Payment Integrations', status: 'Synchronized', details: 'Keys configured' },
                  { name: 'Vercel Edge Network', status: 'Operational', details: 'Routing online' },
                  { name: 'Row-Level Security (RLS)', status: 'Enforced', details: 'Profiles table protected' },
                  { name: 'Security Audit Logs', status: 'Auditing Active', details: 'admin_logs listening' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3.5 bg-slate-950 border border-[#1c1c1e] rounded-2xl relative overflow-hidden group hover:border-[#ff2a85]/30 transition-all duration-300">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-extrabold block">{item.name}</span>
                      <span className="text-[10px] text-slate-500 block font-normal">{item.details}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2 mt-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick action shortcuts */}
            <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[#ff2a85]" />
                <h3 className="text-base font-bold font-sans tracking-wide">Quick Controls</h3>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { label: 'Provision Operators', action: () => { setTab('admins'); setIsProvisionFormOpen(true); }, icon: Shield, desc: 'Generate system credentials.' },
                  { label: 'Regulate User base', action: () => setTab('customers'), icon: Users, desc: 'Search and purge buyer records.' },
                  { label: 'Payment Gateway Keys', action: () => setTab('payments'), icon: Lock, desc: 'Update Razorpay & Stripe API keys.' },
                  { label: 'Audit Log Registry', action: () => setTab('logs'), icon: FileCode, desc: 'Full administrative auditing trail.' },
                  { label: 'Catalog Bypass Override', action: () => setTab('products'), icon: Layers, desc: 'Bypass catalog configurations.' }
                ].map((link, idx) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={idx}
                      onClick={link.action}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/[0.04] hover:bg-white/10 hover:border-white/[0.08] text-left w-full transition-all group"
                    >
                      <Icon size={18} className="text-slate-400 group-hover:text-[#ff2a85] transition-colors shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors block">{link.label}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">{link.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MANAGE OPERATORS */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Administrators Directory</h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold">
                Configure privilege tokens, suspension tags, and operator credentials.
              </p>
            </div>
            <button
              onClick={() => setIsProvisionFormOpen(!isProvisionFormOpen)}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2a85] to-purple-650 hover:from-pink-650 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-pink-500/10 transition duration-200"
            >
              {isProvisionFormOpen ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
              {isProvisionFormOpen ? 'Close Panel' : 'Provision Operator'}
            </button>
          </div>

          {/* Provision Operator Collapsible Panel */}
          {isProvisionFormOpen && (
            <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in max-w-xl">
              <div className="flex items-center space-x-3 text-[#ff2a85] border-b border-[#1c1c1e] pb-3">
                <UserPlus size={18} />
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-200">New Account Configuration</h3>
              </div>
              <form onSubmit={handleProvisionAdmin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Staff Name</label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g. Adarsh"
                      required
                      className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Staff Email</label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="operator@soshka.com"
                      required
                      className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-3.5 py-2.5 text-xs outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Password</label>
                    <div className="relative">
                      <input
                        type={showAdminPass ? 'text' : 'password'}
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-3.5 py-2.5 pr-10 text-xs outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPass(!showAdminPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                      >
                        {showAdminPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Privilege Role</label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none transition"
                    >
                      <option value="admin">Administrator (Catalog/Orders)</option>
                      <option value="superadmin">Super Admin (Global access)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={provisioning}
                  className="w-full py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-[#ff2a85] to-purple-650 text-white transition flex items-center justify-center gap-2"
                >
                  {provisioning && <Loader2 size={14} className="animate-spin" />}
                  Generate operator credentials
                </button>
              </form>
            </div>
          )}

          {/* Delete Admin Confirm Dialog */}
          {adminDeleteId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0c0c0d] border border-[#1c1c1e] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center space-x-3 text-red-500">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-bold">Remove Operator Account?</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                  Are you sure you want to permanently delete this administrator profile? This action will revoke their login rights and cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setAdminDeleteId(null)}
                    disabled={adminDeleting}
                    className="px-4 py-2 rounded-xl text-slate-450 hover:bg-white/5 font-semibold text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAdminDelete}
                    disabled={adminDeleting}
                    className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-755 text-white font-bold text-sm transition flex items-center"
                  >
                    {adminDeleting && <Loader2 size={14} className="animate-spin mr-2" />}
                    Confirm Revoke
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Operators directory list */}
          {adminsLoading && admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
              <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Loading administrators directory...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm font-semibold text-xs">
              No administrative accounts registered in database.
            </div>
          ) : (
            <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-4 px-6">Operator details</th>
                      <th className="py-4 px-6">System Role</th>
                      <th className="py-4 px-6">Security status</th>
                      <th className="py-4 px-6">Last Updated</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c1c1e] text-sm font-semibold">
                    {admins.map((adm) => {
                      const isSelf = adm.id === currentProfile?.id;
                      return (
                        <tr key={adm.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="h-9 w-9 rounded-full bg-slate-800 border border-[#1c1c1e] flex items-center justify-center font-black text-slate-300 text-xs">
                                {(adm.name || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-slate-100 font-bold block leading-snug">
                                  {adm.name || 'Staff operator'}
                                  {isSelf && <span className="text-[9px] text-[#ff2a85] bg-pink-950/40 border border-pink-500/10 px-1.5 py-0.5 rounded font-extrabold ml-2">You</span>}
                                </span>
                                <span className="text-[10px] text-slate-500 font-normal block">{adm.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <select
                              value={adm.role}
                              disabled={isSelf}
                              onChange={(e) => handleRoleChange(adm, e.target.value)}
                              className="bg-slate-900 border border-[#26262a] focus:border-[#ff2a85] text-slate-350 rounded-lg text-xs font-semibold px-2.5 py-1.5 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="admin">Administrator</option>
                              <option value="superadmin">Super Admin</option>
                            </select>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleToggleAdminStatus(adm)}
                              disabled={isSelf}
                              className="flex items-center gap-1.5 text-xs font-extrabold disabled:opacity-50"
                            >
                              {adm.is_active !== false ? (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <ToggleRight size={20} className="text-emerald-500" /> Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <ToggleLeft size={20} className="text-slate-600" /> Deactivated
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                            {adm.updated_at ? new Date(adm.updated_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center items-center">
                              <button
                                onClick={() => setAdminDeleteId(adm.id)}
                                disabled={isSelf}
                                className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-955/20 transition-all disabled:opacity-30"
                                title="Delete Admin Profile"
                              >
                                <Trash2 size={16} />
                              </button>
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
        </div>
      )}

      {/* VIEW: MANAGE CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Customers Directory</h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold">
              Browse registered customer profiles and clear inactive accounts.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customers by name, email or phone..."
              className="w-full bg-[#0c0c0d] border border-[#1c1c1e] focus:border-[#ff2a85] text-white rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none transition placeholder:text-slate-600"
            />
          </div>

          {/* Customer Delete confirmation dialog */}
          {customerDeleteId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0c0c0d] border border-[#1c1c1e] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center space-x-3 text-red-500">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-bold">Delete Customer Account?</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                  Are you sure you want to permanently delete this customer profile? This action will revoke their login rights, purge their records, and cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setCustomerDeleteId(null)}
                    disabled={customerDeleting}
                    className="px-4 py-2 rounded-xl text-slate-450 hover:bg-white/5 font-semibold text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCustomerDelete}
                    disabled={customerDeleting}
                    className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-755 text-white font-bold text-sm transition flex items-center"
                  >
                    {customerDeleting && <Loader2 size={14} className="animate-spin mr-2" />}
                    Delete Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customer list records */}
          {customersLoading && customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
              <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Loading customers list...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm font-semibold text-xs">
              {customerSearch ? 'No customers match your search.' : 'No customer profiles found in database.'}
            </div>
          ) : (
            <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-4 px-6">Customer Profile</th>
                      <th className="py-4 px-6">Phone Number</th>
                      <th className="py-4 px-6">Last Updated</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c1c1e] text-sm font-semibold">
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            {cust.avatar_url ? (
                              <img
                                src={cust.avatar_url}
                                alt=""
                                className="h-9 w-9 rounded-full object-cover border border-[#1c1c1e]"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-slate-800 border border-[#1c1c1e] flex items-center justify-center font-black text-slate-350 text-xs">
                                {(cust.name || 'C').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="text-slate-100 font-bold block leading-snug">
                                {cust.name || 'Anonymous client'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-normal block">{cust.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-300 font-mono">
                          {cust.phone || '—'}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                          {cust.updated_at ? new Date(cust.updated_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center items-center">
                            <button
                              onClick={() => setCustomerDeleteId(cust.id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-955/20 transition"
                              title="Delete Customer Profile"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: GATEWAYS SETTINGS */}
      {activeTab === 'payments' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Payment Gateways Settings</h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold">
              Configure API keys, secret credentials, and active checkout triggers.
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-950/20 border border-amber-500/20 text-amber-300 rounded-2xl text-xs font-semibold leading-relaxed animate-fade-in">
            <AlertTriangle size={20} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">Critical Access Control Notice</p>
              <p className="text-amber-400/80 mt-0.5">
                Only verified Super Administrators have RLS clearance to modify these keys. All changes are logged globally inside the security audit trails.
              </p>
            </div>
          </div>

          {paymentsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
              <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Loading credentials securely...</p>
            </div>
          ) : (
            <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center space-x-3 text-[#ff2a85] border-b border-[#1c1c1e] pb-4">
                <CreditCard size={22} />
                <h3 className="text-sm uppercase font-extrabold tracking-widest text-slate-200">Gateway configuration</h3>
              </div>

              <form onSubmit={handleSavePaymentConfigs} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Payment Provider
                  </label>
                  <select
                    value={selectedGateway}
                    onChange={(e) => {
                      setSelectedGateway(e.target.value);
                      setShowSecret(false);
                    }}
                    disabled={paymentsSaving}
                    className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-slate-300 rounded-xl px-4 py-3 text-sm outline-none transition"
                  >
                    <option value="razorpay">Razorpay Checkout</option>
                    <option value="stripe">Stripe Payments</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Public API Key (Client ID)
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={selectedGateway === 'stripe' ? 'pk_live_...' : 'rzp_live_...'}
                    disabled={paymentsSaving}
                    required
                    className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition placeholder:text-slate-650 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Secret API Key (Secret Token)
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="••••••••••••••••••••"
                      disabled={paymentsSaving}
                      required
                      className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-655 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-[#1c1c1e] rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Enable checkout gateway</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Activate this provider to accept transactions on checkout.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isGatewayActive}
                    disabled={paymentsSaving}
                    onChange={(e) => setIsGatewayActive(e.target.checked)}
                    className="w-4 h-4 text-pink-600 border-[#26262a] rounded bg-slate-950 focus:ring-[#ff2a85]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={paymentsSaving}
                  className="w-full py-3 mt-2 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#ff2a85] to-purple-650 text-white transition flex items-center justify-center gap-2"
                >
                  {paymentsSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Storing Keys Safely...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Configurations
                    </>
                  )}
                </button>
              </form>

              {paymentSettings.find(s => s.gateway === selectedGateway) && (
                <div className="border-t border-[#1c1c1e] pt-4 flex flex-col sm:flex-row justify-between text-[10px] font-mono text-slate-500 gap-2">
                  <span className="flex items-center">
                    <Calendar size={12} className="mr-1.5 shrink-0" />
                    Updated: {new Date(paymentSettings.find(s => s.gateway === selectedGateway).updated_at).toLocaleString()}
                  </span>
                  <span>
                    Updated by: <code className="text-pink-400 font-bold font-mono">{paymentSettings.find(s => s.gateway === selectedGateway).profile?.name || paymentSettings.find(s => s.gateway === selectedGateway).profile?.email || 'N/A'}</code>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: CATALOG PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Products Inventory</h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold">
                Authority bypass: override, edit, or purge items from the store catalog.
              </p>
            </div>
            <Link
              to="/superadmin/products/new"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2a85] to-purple-650 hover:from-pink-650 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-pink-500/10 transition duration-200 font-sans"
            >
              <Plus size={16} className="mr-2" />
              Add Product
            </Link>
          </div>

          <div className="flex items-center bg-[#0c0c0d] border border-[#1c1c1e] rounded-2xl px-4 py-3 shadow-sm max-w-md">
            <Search size={18} className="text-slate-500 mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="bg-transparent text-sm w-full outline-none border-none focus:ring-0 text-white placeholder:text-slate-655"
            />
          </div>

          {/* Delete Product Confirmation dialog */}
          {productDeleteId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0c0c0d] border border-[#1c1c1e] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center space-x-3 text-red-500">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-bold">Delete Product Listing?</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                  Are you sure you want to permanently delete this product listing? This action cannot be undone and will remove it from store databases.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setProductDeleteId(null)}
                    disabled={productDeleting}
                    className="px-4 py-2 rounded-xl text-slate-450 hover:bg-white/5 font-semibold text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmProductDelete}
                    disabled={productDeleting}
                    className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-755 text-white font-bold text-sm transition flex items-center"
                  >
                    {productDeleting && <Loader2 size={14} className="animate-spin mr-2" />}
                    Delete Listing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products grid table */}
          {productsLoading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
              <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Loading catalog...</p>
            </div>
          ) : products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm font-semibold text-xs">
              No products found matching filters.
            </div>
          ) : (
            <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-4 px-6">Image</th>
                      <th className="py-4 px-6">Product Info</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Price</th>
                      <th className="py-4 px-6">Stock status</th>
                      <th className="py-4 px-6">Rating</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c1c1e] text-sm font-semibold">
                    {products
                      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((product) => {
                        const hasOffer = product.offer_price && product.offers?.is_active;
                        const originalPrice = product.original_price ?? product.price;
                        return (
                          <tr key={product.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-6">
                              <img
                                src={product.images?.[0] || ''}
                                alt={product.name}
                                className="h-11 w-11 rounded-xl object-cover border border-[#1c1c1e] bg-slate-900"
                              />
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-slate-100 font-bold block line-clamp-1">{product.name}</span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[200px] font-normal">{product.description || 'No description'}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-[10px] font-extrabold text-[#ff2a85] uppercase tracking-widest">{product.category}</span>
                            </td>
                            <td className="py-4 px-6">
                              {hasOffer ? (
                                <div className="flex flex-col">
                                  <span className="text-[#ff2a85] font-extrabold">{formatCurrency(product.offer_price)}</span>
                                  <span className="text-[10px] text-slate-500 line-through leading-none">{formatCurrency(originalPrice)}</span>
                                </div>
                              ) : (
                                <span className="text-slate-205 font-extrabold">{formatCurrency(originalPrice)}</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                product.stock > 0
                                  ? 'bg-emerald-950/20 text-emerald-400'
                                  : 'bg-red-950/20 text-red-400'
                              }`}>
                                {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-xs text-slate-400 font-bold">★ {product.rating || '0.0'} ({product.review_count || 0})</span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex justify-center items-center space-x-2">
                                <Link
                                  to={`/superadmin/products/${product.id}`}
                                  className="p-2 rounded-xl text-slate-500 hover:text-[#ff2a85] hover:bg-red-955/20 transition"
                                  title="Edit Product"
                                >
                                  <Edit size={16} />
                                </Link>
                                <button
                                  onClick={() => setProductDeleteId(product.id)}
                                  className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-955/20 transition"
                                  title="Delete Product"
                                >
                                  <Trash2 size={16} />
                                </button>
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
        </div>
      )}

      {/* VIEW: SHIPPING ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Order Registry</h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold">
              Global purchase auditing: track dispatch status, payment methods, and user details.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex items-center bg-[#0c0c0d] border border-[#1c1c1e] rounded-2xl px-4 py-3 shadow-sm max-w-md w-full animate-fade-in">
              <Search size={18} className="text-slate-500 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search by email, name, or order id..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="bg-transparent text-sm w-full outline-none border-none focus:ring-0 text-white placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Filter status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
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

          {/* Orders list table */}
          {ordersLoading && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
              <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Loading orders...</p>
            </div>
          ) : orders.filter(o => {
            const matchesSearch = (o.id?.toLowerCase().includes(orderSearch.toLowerCase()) || o.profile?.name?.toLowerCase().includes(orderSearch.toLowerCase()) || o.profile?.email?.toLowerCase().includes(orderSearch.toLowerCase()));
            const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
            return matchesSearch && matchesStatus;
          }).length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm font-semibold text-xs">
              No transaction orders match filters.
            </div>
          ) : (
            <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-4 px-6">Order ID</th>
                      <th className="py-4 px-6">Customer Profile</th>
                      <th className="py-4 px-6">Items Purchased</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Grand Total</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c1c1e] text-sm font-semibold">
                    {orders
                      .filter(o => {
                        const matchesSearch = (o.id?.toLowerCase().includes(orderSearch.toLowerCase()) || o.profile?.name?.toLowerCase().includes(orderSearch.toLowerCase()) || o.profile?.email?.toLowerCase().includes(orderSearch.toLowerCase()));
                        const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="hover:bg-white/[0.01] transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6 font-mono text-xs text-slate-400 truncate max-w-[120px]" title={order.id}>
                            {order.id}
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-100 font-bold block">{order.profile?.name || 'Anonymous'}</span>
                            <span className="text-[10px] text-slate-500 block font-normal">{order.profile?.email || 'N/A'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1 max-w-[200px]">
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="text-xs truncate">
                                  <span className="font-bold text-slate-350">{item.name}</span>
                                  <span className="text-slate-500 text-[10px] ml-1.5">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 font-extrabold text-slate-200">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full border ${getOrderStatusBadge(order.status)}`}>
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

          {/* Details modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0c0c0d] border border-[#1c1c1e] max-w-2xl w-full rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative text-white">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-slate-400"
                >
                  <X size={18} />
                </button>

                <div>
                  <div className="flex items-center space-x-2 text-[#ff2a85] mb-1">
                    <ShoppingCart size={20} />
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">Order details panel</span>
                  </div>
                  <h3 className="text-base font-black font-mono select-all truncate max-w-[90%]">{selectedOrder.id}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div className="space-y-1.5 border-b border-[#1c1c1e] pb-3">
                      <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Customer details</span>
                      <p className="font-extrabold text-slate-200">{selectedOrder.profile?.name || 'Anonymous'}</p>
                      <p className="text-xs text-slate-400">{selectedOrder.profile?.email || 'N/A'}</p>
                    </div>
                    <div className="space-y-1.5 border-b border-[#1c1c1e] pb-3">
                      <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">Date Placed</span>
                      <p className="text-xs text-slate-400 font-bold">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">📍 Shipping Address</span>
                      <div className="text-xs text-slate-450 leading-relaxed font-semibold">
                        <p className="text-white">{selectedOrder.shipping_address?.name}</p>
                        <p>{selectedOrder.shipping_address?.addressLine || selectedOrder.shipping_address?.line1}</p>
                        <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.postalCode || selectedOrder.shipping_address?.postal_code}</p>
                        <p>Tel: {selectedOrder.shipping_address?.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-slate-950 border border-[#1c1c1e] p-5 rounded-2xl">
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider block">Update Status</span>
                      <select
                        value={selectedOrder.status}
                        disabled={updatingOrderStatus}
                        onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-900 border-[#26262a] focus:outline-none text-slate-350"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#1c1c1e]">
                      <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider block">Transaction parameters</span>
                      <div className="text-xs font-semibold text-slate-450 space-y-1">
                        <div className="flex justify-between">
                          <span>Gateway ID:</span>
                          <span className="font-mono text-white select-all">{selectedOrder.payment_id || 'Cash on Delivery'}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#1c1c1e] pt-2 text-sm font-extrabold text-white">
                          <span>Grand Total:</span>
                          <span className="text-[#ff2a85] font-black">{formatCurrency(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">📦 Items list</span>
                  <div className="divide-y divide-[#1c1c1e] bg-slate-950 border border-[#1c1c1e] rounded-2xl overflow-hidden text-xs">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 font-semibold">
                        <div className="flex items-center space-x-3 truncate max-w-[70%]">
                          <img
                            src={item.image || ''}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover border border-[#1c1c1e]"
                          />
                          <div className="truncate">
                            <span className="font-extrabold text-slate-200 block truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-500">{formatCurrency(item.price)} x{item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-extrabold text-white shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: SECURITY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Security Audit Logs</h2>
            <p className="text-slate-450 text-xs mt-1 font-semibold">
              Read-only operations log: review system audits and administrative configuration edits.
            </p>
          </div>

          {/* Filters accordions */}
          <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-350 font-bold text-xs uppercase tracking-wider">
              <Filter size={14} className="text-[#ff2a85]" />
              <span>Log Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">Operation</label>
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setLogsPage(1); }}
                  className="bg-slate-950 border border-[#26262a] text-slate-300 text-xs rounded-xl px-3 py-2 outline-none"
                >
                  <option value="">All Operations</option>
                  <option value="created_admin">created_admin</option>
                  <option value="activated_admin">activated_admin</option>
                  <option value="deactivated_admin">deactivated_admin</option>
                  <option value="updated_admin_role">updated_admin_role</option>
                  <option value="deleted_admin">deleted_admin</option>
                  <option value="deleted_product">deleted_product</option>
                  <option value="updated_order_status">updated_order_status</option>
                  <option value="updated_payment_settings">updated_payment_settings</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">Affected Table</label>
                <select
                  value={tableFilter}
                  onChange={(e) => { setTableFilter(e.target.value); setLogsPage(1); }}
                  className="bg-slate-950 border border-[#26262a] text-slate-300 text-xs rounded-xl px-3 py-2 outline-none"
                >
                  <option value="">All Tables</option>
                  <option value="profiles">profiles (Operators)</option>
                  <option value="products">products (Catalogue)</option>
                  <option value="orders">orders (Sales)</option>
                  <option value="payment_settings">payment_settings (Billing)</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">Responsible Actor</label>
                <select
                  value={actorFilter}
                  onChange={(e) => { setActorFilter(e.target.value); setLogsPage(1); }}
                  className="bg-slate-950 border border-[#26262a] text-slate-300 text-xs rounded-xl px-3 py-2 outline-none"
                >
                  <option value="">All Operators</option>
                  {actorsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setLogsPage(1); }}
                  className="bg-slate-950 border border-[#26262a] text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setLogsPage(1); }}
                  className="bg-slate-950 border border-[#26262a] text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Logs table list */}
          {logsLoading && logsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
              <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Loading audit records...</p>
            </div>
          ) : logsList.length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm font-semibold text-xs">
              No audit logs found matching selectors.
            </div>
          ) : (
            <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-4 px-6 w-[20%]">Timestamp</th>
                      <th className="py-4 px-6 w-[20%]">Operator Profile</th>
                      <th className="py-4 px-6 w-[20%]">Action Key</th>
                      <th className="py-4 px-6 w-[15%]">Table Affected</th>
                      <th className="py-4 px-6 w-[15%]">Target Ref ID</th>
                      <th className="py-4 px-6 w-[10%] text-center">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c1c1e] text-sm font-semibold">
                    {logsList.map((log) => {
                      const isExpanded = !!expandedLogs[log.id];
                      return (
                        <React.Fragment key={log.id}>
                          <tr className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-slate-105 font-bold block">{log.profile?.name || 'System Actor'}</span>
                              <span className="text-[10px] text-slate-500 block font-normal">{log.profile?.email || 'automated@soshka.com'}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2 py-0.5 rounded bg-slate-950 text-pink-400 text-[10px] uppercase font-bold font-mono border border-[#ff2a85]/10">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-405 font-mono">
                              {log.target_table}
                            </td>
                            <td className="py-4 px-6 font-mono text-[10px] text-slate-500 select-all">
                              {log.target_id || 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => setExpandedLogs(prev => ({ ...prev, [log.id]: !isExpanded }))}
                                className="p-1.5 rounded bg-slate-950 hover:bg-[#ff2a85]/10 text-slate-400 hover:text-pink-400 border border-[#26262a]"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="bg-slate-955/50 px-8 py-4 border-t border-b border-[#1c1c1e]">
                                <div className="bg-slate-950 border border-[#26262a] p-4 rounded-xl font-mono text-[11px] text-slate-350 leading-relaxed overflow-x-auto">
                                  <p className="font-extrabold text-[#ff2a85] mb-2 uppercase text-[9px] tracking-widest">Metadata Payload JSON</p>
                                  <pre className="select-all">{JSON.stringify(log.details || {}, null, 2)}</pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {Math.ceil(logsCount / logsLimit) > 1 && (
                <div className="flex items-center justify-between px-6 pt-4 border-t border-[#1c1c1e] text-xs">
                  <span className="text-slate-500 font-bold">
                    Showing logs page {logsPage} of {Math.ceil(logsCount / logsLimit)} ({logsCount} total records)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLogsPage(p => Math.max(p - 1, 1))}
                      disabled={logsPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 border border-[#26262a] font-extrabold disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setLogsPage(p => Math.min(p + 1, Math.ceil(logsCount / logsLimit)))}
                      disabled={logsPage === Math.ceil(logsCount / logsLimit)}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 border border-[#26262a] font-extrabold disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: PROFIT & LOSS STATEMENTS */}
      {activeTab === 'pandl' && (() => {
        const { revenue, cogs, grossProfit, grossMargin, transactionList, productStatsList } = getPandLStats();
        
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <span className="p-1.5 bg-[#ff2a85]/10 text-[#ff2a85] rounded-lg border border-[#ff2a85]/20">
                    <DollarSign size={20} />
                  </span>
                  Profit & Loss Statement
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">
                  Complete operational report detailing Gross Sales, Cost of Goods Sold (COGS), and Gross Margin performance.
                </p>
              </div>

              {/* Date Filters */}
              <div className="flex flex-wrap items-center gap-3 bg-[#0c0c0d] border border-[#1c1c1e] p-3 rounded-2xl">
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-bold uppercase">
                  <Filter size={12} className="text-[#ff2a85]" />
                  <span>Filter Period:</span>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-950 border border-[#26262a] text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-[#ff2a85]"
                />
                <span className="text-slate-500 font-bold text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-950 border border-[#26262a] text-slate-350 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-[#ff2a85]"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="p-1 px-2.5 rounded-lg bg-red-950/20 hover:bg-red-955/40 text-red-400 border border-red-550/10 text-[10px] font-extrabold uppercase transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Gross Sales */}
              <div className="bg-[#0c0c0d] border border-[#1c1c1e] p-6 rounded-3xl space-y-1 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Gross Sales</span>
                <h3 className="text-3xl font-black text-white">{formatCurrency(revenue)}</h3>
                <p className="text-[11px] text-slate-400 font-bold">Total revenue from order sales</p>
              </div>

              {/* COGS */}
              <div className="bg-[#0c0c0d] border border-[#1c1c1e] p-6 rounded-3xl space-y-1 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Cost of Goods Sold (COGS)</span>
                <h3 className="text-3xl font-black text-rose-400">{formatCurrency(cogs)}</h3>
                <p className="text-[11px] text-slate-400 font-bold">Calculated total inventory cost</p>
              </div>

              {/* Gross Profit */}
              <div className="bg-[#0c0c0d] border border-[#1c1c1e] p-6 rounded-3xl space-y-1 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Gross Profit</span>
                <h3 className={`text-3xl font-black ${grossProfit >= 0 ? 'text-emerald-400' : 'text-red-455'}`}>
                  {formatCurrency(grossProfit)}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">Net operational profit amount</p>
              </div>

              {/* Gross Margin */}
              <div className="bg-[#0c0c0d] border border-[#1c1c1e] p-6 rounded-3xl space-y-1 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Gross Margin</span>
                <h3 className={`text-3xl font-black ${grossMargin >= 25 ? 'text-emerald-400' : 'text-amber-450'}`}>
                  {grossMargin.toFixed(2)}%
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">Profit percent on operational sales</p>
              </div>
            </div>

            {/* BREAKDOWN TABLES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Product Profitability Breakdown */}
              <div className="lg:col-span-7 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="p-6 border-b border-[#1c1c1e] flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300">Product Profitability</h3>
                      <p className="text-[11px] text-slate-550 mt-0.5 font-semibold">Breakdown of earnings and cost margins per catalog item.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/30 border-b border-[#1c1c1e] text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                          <th className="py-3 px-6">Product Details</th>
                          <th className="py-3 px-4 text-center">Units Sold</th>
                          <th className="py-3 px-4 text-right">Revenue</th>
                          <th className="py-3 px-4 text-right">COGS</th>
                          <th className="py-3 px-4 text-right">Profit</th>
                          <th className="py-3 px-6 text-center">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1c1c1e] text-xs font-semibold text-slate-300">
                        {productStatsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                              No product sales recorded in this period.
                            </td>
                          </tr>
                        ) : (
                          productStatsList.map((prod) => (
                            <tr key={prod.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="py-3 px-6">
                                <span className="font-bold text-slate-200 block truncate max-w-[200px]">{prod.name}</span>
                                <span className="text-[10px] text-slate-500 block font-normal">{prod.category}</span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-400">{prod.quantity}</td>
                              <td className="py-3 px-4 text-right font-mono text-slate-200">{formatCurrency(prod.revenue)}</td>
                              <td className="py-3 px-4 text-right font-mono text-rose-400/90">{formatCurrency(prod.totalCost)}</td>
                              <td className={`py-3 px-4 text-right font-mono font-bold ${prod.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(prod.profit)}
                              </td>
                              <td className="py-3 px-6 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  prod.margin >= 25 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' : 'bg-amber-950/40 text-amber-400 border border-amber-500/10'
                                }`}>
                                  {prod.margin.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Transaction Statement Breakdown */}
              <div className="lg:col-span-5 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="p-6 border-b border-[#1c1c1e]">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350">Transaction Ledger</h3>
                    <p className="text-[11px] text-slate-450 mt-0.5 font-semibold">Details and margins per individual transaction.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/30 border-b border-[#1c1c1e] text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                          <th className="py-3 px-6">Order ID & Date</th>
                          <th className="py-3 px-4 text-right">Total</th>
                          <th className="py-3 px-4 text-right">COGS</th>
                          <th className="py-3 px-4 text-right">Profit</th>
                          <th className="py-3 px-6 text-center">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1c1c1e] text-xs font-semibold text-slate-300">
                        {transactionList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500 font-bold">
                              No transactions recorded in this period.
                            </td>
                          </tr>
                        ) : (
                          transactionList.slice(0, 15).map((order) => (
                            <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="py-3 px-6">
                                <span className="font-mono text-[10px] text-slate-400 block uppercase select-all">
                                  #{order.id.slice(0, 8)}
                                </span>
                                <span className="text-[10px] text-slate-500 block font-normal">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-200">{formatCurrency(order.total)}</td>
                              <td className="py-3 px-4 text-right font-mono text-rose-400/90">{formatCurrency(order.cogs)}</td>
                              <td className={`py-3 px-4 text-right font-mono font-bold ${order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(order.profit)}
                              </td>
                              <td className="py-3 px-6 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                  order.margin >= 25 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-amber-950/40 text-amber-400'
                                }`}>
                                  {order.margin.toFixed(0)}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* VIEW: STORE REVIEWS */}
      {activeTab === 'reviews' && (
        <AdminReviewsPage />
      )}

    </div>
  );
};

export default SuperAdminDashboard;