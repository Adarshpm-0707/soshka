import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [adding, setAdding] = useState(false);

  // Inline edit states
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deleteCat, setDeleteCat] = useState(null);
  const [linkedProductsCount, setLinkedProductsCount] = useState(0);
  const [checkingLink, setCheckingLink] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      showToast(err.message || 'Error loading categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAdding(true);
    try {
      // Slug auto-generation
      const slug = newCatName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const { error } = await supabase
        .from('categories')
        .insert({ name: newCatName.trim(), slug });
      
      if (error) throw error;

      showToast('Category created successfully!', 'success');
      setNewCatName('');
      await fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err);
      showToast(err.message || 'Failed to create category', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = async (id) => {
    if (!editingName.trim()) return;
    setSaving(true);
    try {
      const slug = editingName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const { error } = await supabase
        .from('categories')
        .update({ name: editingName.trim(), slug })
        .eq('id', id);

      if (error) throw error;

      showToast('Category updated successfully!', 'success');
      setEditingId(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      showToast(err.message || 'Failed to update category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStartDelete = async (cat) => {
    setDeleteCat(cat);
    setCheckingLink(true);
    try {
      // Check if any products are linked to this category ID
      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id);
      
      if (error) throw error;
      setLinkedProductsCount(count || 0);
    } catch (err) {
      console.error('Error checking category links:', err);
    } finally {
      setCheckingLink(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCat) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteCat.id);
      
      if (error) throw error;

      showToast('Category deleted successfully', 'success');
      setDeleteCat(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      showToast(err.message || 'Failed to delete category', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-white max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Category Management</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Organize product segments with automated slug compilation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Add Category Form */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
          <form onSubmit={handleAdd} className="space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Add Category
            </h3>
            <Input
              label="Category Name"
              id="categoryName"
              placeholder="e.g. Fine Necklaces"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
              disabled={adding}
            />
            <Button
              type="submit"
              className="w-full font-bold text-xs"
              loading={adding}
              disabled={adding || !newCatName.trim()}
            >
              Add Category
            </Button>
          </form>
        </div>

        {/* Right Side: Category List */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
              <p className="text-xs font-semibold text-slate-500">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center text-slate-450 dark:text-slate-500">
              No categories configured yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Slug</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm font-semibold">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="py-4 px-6">
                        {editingId === cat.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            disabled={saving}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-sm font-semibold w-full focus:outline-none focus:border-[#ff2a85]"
                            autoFocus
                          />
                        ) : (
                          <span className="text-slate-800 dark:text-slate-100 font-bold">{cat.name}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-slate-400">{cat.slug}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center space-x-2">
                          {editingId === cat.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(cat.id)}
                                disabled={saving}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition"
                                title="Save"
                              >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                disabled={saving}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(cat)}
                                className="p-2 rounded-xl text-slate-400 hover:text-[#ff2a85] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                title="Edit inline"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleStartDelete(cat)}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete warnings */}
      {deleteCat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0d] border border-[#1c1c1e] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6 text-white">
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Delete Category?</h3>
            </div>
            
            {checkingLink ? (
              <p className="text-sm text-slate-400">Verifying link relations...</p>
            ) : linkedProductsCount > 0 ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-xl text-xs font-semibold leading-relaxed">
                ⚠️ WARNING: There are {linkedProductsCount} product(s) linked to this category. If you delete this category, those products will lose their category references.
              </div>
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed">
                Are you sure you want to delete the category <span className="text-[#ff2a85] font-extrabold">{deleteCat.name}</span>? This action is irreversible.
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteCat(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-slate-350 hover:bg-white/5 font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting || checkingLink}
                className="px-4.5 py-2.5 rounded-xl bg-red-650 hover:bg-red-700 text-white font-bold text-sm transition flex items-center"
              >
                {deleting && <Loader2 size={14} className="animate-spin mr-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
