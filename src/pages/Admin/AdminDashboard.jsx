import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ShoppingBag, ShoppingCart, Users, DollarSign, Loader2, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/Reusable/Toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    usersCount: 0,
    ordersCount: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch users count (customers only, role = 'user')
        const { count: usersCount, error: uError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'user')
          .not('email', 'ilike', '%admin%')
          .neq('email', 'adarshpm0707@gmail.com');
        if (uError) throw uError;

        // Fetch orders and revenue
        const { data: ordersData, error: oError } = await supabase
          .from('orders')
          .select('total, status');
        if (oError) throw oError;

        const ordersCount = ordersData?.length || 0;
        const totalRevenue = (ordersData || [])
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, order) => sum + Number(order.total), 0);

        setStats({
          usersCount: usersCount || 0,
          ordersCount: ordersCount || 0,
          revenue: totalRevenue,
        });

        // Fetch products
        const { data: prodData, error: pError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (pError) throw pError;
        setProducts(prodData || []);

        // Fetch categories from database
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('*');
        if (catErr) throw catErr;
        setCategories(catData || []);

      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        setError(err.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleUpdateQty = async (id, delta) => {
    const item = products.find(p => p.id === id);
    if (!item) return;
    const newQty = Math.max(0, (item.stock || 0) + delta);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newQty })
        .eq('id', id);
      if (error) throw error;
      
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newQty } : p));
      showToast('Quantity updated', 'success');
    } catch (err) {
      console.error('Error updating stock quantity:', err);
      showToast(err.message || 'Error updating quantity', 'error');
    }
  };

  const handleAdd10Qty = async (id) => {
    const item = products.find(p => p.id === id);
    if (!item) return;
    const newQty = (item.stock || 0) + 10;
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newQty })
        .eq('id', id);
      if (error) throw error;
      
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newQty } : p));
      showToast('Added 10 units to stock', 'success');
    } catch (err) {
      console.error('Error adding stock:', err);
      showToast(err.message || 'Error updating quantity', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('Product deleted successfully', 'info');
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast(err.message || 'Error deleting product', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
        <p className="text-sm font-semibold text-slate-500">Loading stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50/10 border border-red-500/20 text-red-500 rounded-2xl">
        <h3 className="font-bold">Error loading stats</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Calculations
  const productsCount = products.length;
  const inventoryValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.original_price || p.price || 0)), 0);
  const revenuePotential = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || p.original_price || 0)), 0);

  // Alerts
  const lowStockList = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStockList = products.filter(p => p.stock === 0);
  const alertsCount = lowStockList.length + outOfStockList.length;

  const CAT_ICONS = { Necklace: "📿", Earrings: "✨", Bangles: "🟡", Ring: "💍", Anklet: "🌸", Bracelet: "💛", Pendant: "🔮", Set: "🎁" };

  const getStockStatus = (qty) => {
    if (qty === 0) return 'Out of Stock';
    if (qty <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const getBadgeClass = (status) => {
    if (status === 'In Stock') return 'badge-crm badge-in-crm';
    if (status === 'Low Stock') return 'badge-crm badge-low-crm';
    return 'badge-crm badge-out-crm';
  };

  // Filtered Products for Inventory sub-page
  const filteredProducts = products
    .filter(p => {
      if (filterCat === 'All') return true;
      return p.category?.toLowerCase() === filterCat.toLowerCase();
    })
    .filter(p => {
      if (filterStatus === 'All') return true;
      if (filterStatus === 'In Stock') return p.stock > 5;
      if (filterStatus === 'Low Stock') return p.stock > 0 && p.stock <= 5;
      if (filterStatus === 'Out of Stock') return p.stock === 0;
      return true;
    })
    .filter(p => {
      const term = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.slug?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name?.localeCompare(b.name);
      if (sortBy === 'qty') return (b.stock || 0) - (a.stock || 0);
      if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
      return 0;
    });

  // Unified clickable stats cards
  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.revenue),
      icon: '💰',
      sub: 'sales completed',
      onClick: () => navigate('/admin/orders')
    },
    {
      title: 'Total Orders',
      value: stats.ordersCount,
      icon: '🛒',
      sub: 'order volumes',
      onClick: () => navigate('/admin/orders')
    },
    {
      title: 'Total SKUs',
      value: productsCount,
      icon: '💍',
      sub: 'unique styles',
      onClick: () => { setFilterCat('All'); setView('inventory'); }
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(inventoryValue),
      icon: '📦',
      sub: 'at retail price',
      onClick: () => { setFilterCat('All'); setView('inventory'); }
    },
    {
      title: 'Active Alerts',
      value: alertsCount,
      icon: '⚠️',
      sub: `${outOfStockList.length} out · ${lowStockList.length} low`,
      onClick: () => setView('alerts')
    },
    {
      title: 'Registered Users',
      value: stats.usersCount,
      icon: '👥',
      sub: 'customer profiles',
      onClick: () => navigate('/admin/customers')
    }
  ];

  return (
    <div className="crm-body font-sans space-y-6 animate-fade-in p-2 sm:p-4 text-slate-800 dark:text-slate-100">
      
      {/* Page Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight crm-font-serif text-[#5C0F26] dark:text-[#E8C9A8]">
            Sõshka
          </h1>
          <p className="text-slate-550 dark:text-slate-450 text-xs tracking-wider uppercase mt-1">
            Jewellery Inventory Management System
          </p>
        </div>
        
        {/* Navigation tabs inside main section */}
        <div className="flex bg-[#F5E6EC] dark:bg-[#1c1c1e] p-1 rounded-2xl border border-[#E5C4CE] dark:border-[#2c2c2e] self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition duration-200 ${
              view === 'dashboard'
                ? 'bg-[#8B1A3A] text-white shadow-md'
                : 'text-[#7A3D52] hover:text-[#8B1A3A] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('inventory')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition duration-200 ${
              view === 'inventory'
                ? 'bg-[#8B1A3A] text-white shadow-md'
                : 'text-[#7A3D52] hover:text-[#8B1A3A] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setView('alerts')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition duration-200 ${
              view === 'alerts'
                ? 'bg-[#8B1A3A] text-white shadow-md'
                : 'text-[#7A3D52] hover:text-[#8B1A3A] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Alerts {alertsCount > 0 ? `(${alertsCount})` : ''}
          </button>
        </div>
      </div>

      {/* Main View Render */}
      {view === 'dashboard' && (
        <div className="space-y-6">
          {/* Re-arranged Clickable Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statCards.map((card, i) => (
              <div
                key={i}
                onClick={card.onClick}
                className="stat-card-crm cursor-pointer border border-[#E5C4CE] dark:border-slate-800 hover:border-[#8B1A3A] dark:hover:border-[#ff2a85] transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5"
                title={`Click to view ${card.title} details`}
              >
                <div className="stat-icon-crm text-2xl mb-1">{card.icon}</div>
                <div className="stat-val-crm text-[#5C0F26] dark:text-[#E8C9A8] text-2xl font-black">{card.value}</div>
                <div className="stat-label-crm text-xs uppercase tracking-widest mt-1 text-[#7A3D52] dark:text-slate-450">{card.title}</div>
                <div className="stat-sub-crm text-[10px] text-slate-450 mt-0.5">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Stock by Dynamic Category (Database-driven) */}
          <div className="section-card-crm">
            <div className="section-title-crm font-black text-[#5C0F26] dark:text-[#E8C9A8]">Stock by Category</div>
            <div className="cat-grid-crm mt-3">
              {categories.map(cat => {
                const catItems = products.filter(p => p.category?.toLowerCase() === cat.name?.toLowerCase());
                const catStock = catItems.reduce((sum, p) => sum + (p.stock || 0), 0);
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setFilterCat(cat.name);
                      setView('inventory');
                    }}
                    className="cat-chip-crm cursor-pointer hover:shadow-sm"
                  >
                    <div className="cat-chip-icon-crm">{CAT_ICONS[cat.name] || '💎'}</div>
                    <div className="cat-chip-name-crm font-semibold">{cat.name}</div>
                    <div className="cat-chip-sub-crm">{catItems.length} SKU · {catStock}pc</div>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <div className="empty-crm text-sm text-slate-400 py-4 col-span-full text-center">No categories configured in database.</div>
              )}
            </div>
          </div>

          {/* Recent Inventory (Clickable for full details page) */}
          <div className="section-card-crm">
            <div className="section-title-crm font-black text-[#5C0F26] dark:text-[#E8C9A8]">
              <span>Recent Inventory</span>
              <span className="section-link-crm font-bold text-[#8B1A3A] dark:text-[#ff2a85]" onClick={() => { setFilterCat('All'); setView('inventory'); }}>
                View all →
              </span>
            </div>
            <div className="space-y-1 mt-3">
              {products.slice(0, 4).map(item => {
                const status = getStockStatus(item.stock || 0);
                return (
                  <div
                    key={item.id}
                    className="recent-row-crm cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-all duration-200"
                    onClick={() => navigate(`/admin/products/${item.id}`)}
                    title="Click to view full product details"
                  >
                    {item.images && item.images[0] ? (
                      <img src={item.images[0]} className="recent-thumb-crm" alt="" />
                    ) : (
                      <div className="recent-ph-crm">{CAT_ICONS[item.category] || '💎'}</div>
                    )}
                    <div className="flex-grow min-w-0">
                      <div className="recent-name-crm font-bold truncate text-slate-800 dark:text-slate-100">{item.name}</div>
                      <div className="recent-meta-crm text-xs text-slate-455 mt-0.5">{item.slug?.substring(0, 30)} · {item.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="recent-price-crm font-black text-[#8B1A3A] dark:text-[#ff2a85]">{formatCurrency(item.price)}</div>
                      <div className="recent-qty-crm text-xs text-slate-400 mt-0.5">{item.stock || 0} in stock</div>
                    </div>
                    <span className={getBadgeClass(status)}>{status}</span>
                  </div>
                );
              })}
              {products.length === 0 && (
                <div className="empty-crm text-sm text-slate-400 py-8">No products found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'inventory' && (
        <div className="space-y-6">
          <div className="inv-header-crm">
            <div>
              <div className="page-title-crm font-black text-[#5C0F26] dark:text-[#E8C9A8]">Jewelry Inventory</div>
              <div className="page-sub-crm text-slate-400 text-xs">{filteredProducts.length} items shown</div>
            </div>
            <button
              onClick={() => navigate('/admin/products/new')}
              className="add-btn-crm text-xs font-bold uppercase tracking-wider"
            >
              + Add Item
            </button>
          </div>

          {/* Filters Bar */}
          <div className="filters-crm">
            <input
              className="filter-input-crm w-full md:w-auto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search name, category, or slug..."
            />
            
            <select
              className="filter-select-crm"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            <select
              className="filter-select-crm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Stock Statuses</option>
              <option value="In Stock">In Stock (&gt; 5 units)</option>
              <option value="Low Stock">Low Stock (1-5 units)</option>
              <option value="Out of Stock">Out of Stock (0 units)</option>
            </select>

            <select
              className="filter-select-crm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort: Name</option>
              <option value="qty">Sort: Quantity</option>
              <option value="price">Sort: Price</option>
            </select>
          </div>

          {/* Desktop Table View */}
          <div className="inv-table-wrap-crm border border-[#E5C4CE] dark:border-slate-800">
            <table className="inv-table-crm">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Item Details</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Original Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(item => {
                  const status = getStockStatus(item.stock || 0);
                  return (
                    <tr key={item.id}>
                      <td>
                        {item.images && item.images[0] ? (
                          <img src={item.images[0]} className="item-photo-cell-crm" alt="" />
                        ) : (
                          <div className="item-photo-ph-crm">{CAT_ICONS[item.category] || '💎'}</div>
                        )}
                      </td>
                      <td>
                        <div className="item-name-cell-crm font-black">{item.name}</div>
                        <div className="item-sku-cell-crm text-[10px] text-slate-450">{item.slug}</div>
                      </td>
                      <td className="text-slate-550 dark:text-slate-350">{item.category}</td>
                      <td className="font-bold text-[#8B1A3A] dark:text-[#ff2a85]">{formatCurrency(item.price)}</td>
                      <td className="text-xs text-slate-400">{formatCurrency(item.original_price ?? item.price)}</td>
                      <td>
                        <div className="qty-wrap-crm">
                          <button
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="qty-btn-crm"
                          >
                            −
                          </button>
                          <span className="qty-val-crm font-extrabold">{item.stock || 0}</span>
                          <button
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="qty-btn-crm"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={getBadgeClass(status)}>{status}</span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/admin/products/${item.id}`)}
                            className="edit-btn-crm text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id)}
                            className="del-btn-crm text-xs text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400">
                      No matching inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="inv-cards-crm">
            {filteredProducts.map(item => {
              const status = getStockStatus(item.stock || 0);
              return (
                <div key={item.id} className="item-card-crm">
                  {item.images && item.images[0] ? (
                    <img src={item.images[0]} className="card-thumb-crm" alt="" />
                  ) : (
                    <div className="card-thumb-ph-crm">
                      <span className="text-xl">📷</span>
                      <span className="text-[9px] mt-1 text-slate-400">{item.category}</span>
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <div className="card-name-crm font-bold">{item.name}</div>
                    <div className="card-sku-crm text-[10px] text-slate-450 truncate">{item.slug}</div>
                    <div className="card-row-crm flex items-center gap-2 mt-2">
                      <div className="card-price-crm font-extrabold text-[#8B1A3A] dark:text-[#ff2a85]">{formatCurrency(item.price)}</div>
                      <span className="cat-tag-crm text-[10px]">{item.category}</span>
                      <span className={getBadgeClass(status)}>{status}</span>
                    </div>
                    <div className="card-actions-crm flex items-center justify-between gap-4 mt-3">
                      <div className="qty-wrap-crm">
                        <button
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="qty-btn-crm"
                        >
                          −
                        </button>
                        <span className="qty-val-crm font-black">{item.stock || 0}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="qty-btn-crm"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/admin/products/${item.id}`)}
                          className="edit-btn-crm text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.id)}
                          className="del-btn-crm text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="empty-crm text-sm text-slate-400 py-12">No items found matching the filters.</div>
            )}
          </div>
        </div>
      )}

      {view === 'alerts' && (
        <div className="space-y-6">
          <div>
            <div className="page-title-crm font-black text-[#5C0F26] dark:text-[#E8C9A8]">Stock Alerts</div>
            <div className="page-sub-crm text-slate-400 text-xs">Items requiring catalog management and replenishment.</div>
          </div>

          {/* Out of Stock Section */}
          <div>
            <div className="alert-section-title-crm font-extrabold text-[#991b1b] flex items-center gap-2">
              <span>🔴 OUT OF STOCK ({outOfStockList.length})</span>
            </div>
            <div className="space-y-3">
              {outOfStockList.map(item => (
                <div key={item.id} className="alert-card-crm out font-sans">
                  {item.images && item.images[0] ? (
                    <img src={item.images[0]} className="alert-thumb-crm" alt="" />
                  ) : (
                    <div className="alert-ph-crm">{CAT_ICONS[item.category] || '💎'}</div>
                  )}
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{item.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.slug} · {item.category}</div>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => navigate(`/admin/products/${item.id}`)}
                        className="restock-btn-crm font-bold text-xs"
                      >
                        Restock (Edit)
                      </button>
                      <button
                        onClick={() => handleUpdateQty(item.id, 10)}
                        className="add10-btn-crm font-bold text-xs"
                      >
                        +10 units
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-xs font-black text-[#dc2626] uppercase">0 units</div>
                </div>
              ))}
              {outOfStockList.length === 0 && (
                <div className="text-slate-400 text-xs italic py-2 pl-2">No out of stock items.</div>
              )}
            </div>
          </div>

          {/* Low Stock Section */}
          <div className="pt-4">
            <div className="alert-section-title-crm font-extrabold text-[#92400e] flex items-center gap-2">
              <span>🟡 LOW STOCK ({lowStockList.length})</span>
            </div>
            <div className="space-y-3">
              {lowStockList.map(item => (
                <div key={item.id} className="alert-card-crm low font-sans">
                  {item.images && item.images[0] ? (
                    <img src={item.images[0]} className="alert-thumb-crm" alt="" />
                  ) : (
                    <div className="alert-ph-crm">{CAT_ICONS[item.category] || '💎'}</div>
                  )}
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{item.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.slug} · {item.category}</div>
                    <button
                      onClick={() => handleAdd10Qty(item.id)}
                      className="add10-btn-crm font-bold text-xs mt-2"
                    >
                      +10 Stock
                    </button>
                  </div>
                  <div className="text-right text-xs font-black text-[#d97706]">{item.stock} units</div>
                </div>
              ))}
              {lowStockList.length === 0 && (
                <div className="text-slate-400 text-xs italic py-2 pl-2">No low stock items.</div>
              )}
            </div>
          </div>

          {/* Fully Stocked State */}
          {outOfStockList.length === 0 && lowStockList.length === 0 && (
            <div className="empty-crm py-16 flex flex-col items-center">
              <span className="text-4xl">✅</span>
              <h3 className="font-extrabold text-[#5C0F26] dark:text-[#E8C9A8] mt-3">All items are well stocked</h3>
              <p className="text-slate-450 text-xs mt-1">No warnings or low stock levels detected at this time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
