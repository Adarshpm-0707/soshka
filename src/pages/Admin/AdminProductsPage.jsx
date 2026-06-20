import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { showToast } from '../../components/Reusable/Toast';
import { adminLogService } from '../../services/adminLogService';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, offers(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching admin products:', err);
      showToast(err.message || 'Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      // Log deletion in admin_logs
      await adminLogService.logAction('deleted_product', 'products', id, { id });

      showToast('Product deleted successfully', 'success');
      setDeleteId(null);
      await fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Products Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Create, update, or remove store listings.
          </p>
        </div>
        <RouterLink
          to="/admin/products/new"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-pink-600 hover:from-primary-700 hover:to-pink-700 text-white font-bold text-sm shadow-md transition duration-200"
        >
          <Plus size={16} className="mr-2" />
          Add Product
        </RouterLink>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 shadow-sm max-w-md">
        <Search size={18} className="text-slate-450 mr-3 shrink-0" />
        <input
          type="text"
          placeholder="Search by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-sm w-full outline-none border-none focus:ring-0"
        />
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0d] border border-[#1c1c1e] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6 text-white">
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Delete Product?</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Are you sure you want to delete this product listing? This action cannot be undone and will permanently remove this item from the store.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-slate-350 hover:bg-white/5 font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-4.5 py-2.5 rounded-xl bg-red-650 hover:bg-red-700 text-white font-bold text-sm transition flex items-center"
              >
                {deleting && <Loader2 size={14} className="animate-spin mr-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-450">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center text-slate-450 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          No products found matching your search.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  <th className="py-4 px-6">Image</th>
                  <th className="py-4 px-6">Product Info</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Rating</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm font-semibold">
                {filteredProducts.map((product) => {
                  const hasOffer = product.offer_price && product.offers?.is_active;
                  const originalPrice = product.original_price ?? product.price;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="py-4 px-6">
                        <img
                          src={product.images?.[0] || ''}
                          alt={product.name}
                          className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-850"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-slate-800 dark:text-slate-100 font-bold block line-clamp-1">{product.name}</span>
                        <span className="text-[10px] text-slate-450 block truncate max-w-[200px]">{product.description || 'No description'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-extrabold text-[#98183f] dark:text-[#ff2a85] uppercase tracking-widest">{product.category}</span>
                      </td>
                      <td className="py-4 px-6">
                        {hasOffer ? (
                          <div className="flex flex-col">
                            <span className="text-[#98183f] dark:text-[#ff2a85] font-extrabold">{formatCurrency(product.offer_price)}</span>
                            <span className="text-[10px] text-slate-400 line-through leading-none">{formatCurrency(originalPrice)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{formatCurrency(originalPrice)}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          product.stock > 0
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        }`}>
                          {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs text-slate-500 dark:text-slate-350 font-bold">★ {product.rating || '0.0'} ({product.review_count || 0})</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center space-x-2">
                          <RouterLink
                            to={`/admin/products/${product.id}`}
                            className="p-2 rounded-xl text-slate-400 hover:text-[#ff2a85] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </RouterLink>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
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
  );
};

export default AdminProductsPage;
