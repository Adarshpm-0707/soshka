import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2, ShieldAlert, Loader2, Calendar, Gift, Check, X } from 'lucide-react';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';
import { adminLogService } from '../../services/adminLogService';
import ConfirmModal from '../../components/Reusable/ConfirmModal';

const AdminOffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form States (Add/Edit)
  const [editingOffer, setEditingOffer] = useState(null); // null for add, offer object for edit
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOfferId, setDeleteOfferId] = useState(null);
  const [deletingOffer, setDeletingOffer] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('All');

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setBannerUrl(publicUrl);
      showToast('Banner image uploaded successfully!', 'success');
    } catch (err) {
      console.error('Banner upload failed:', err);
      showToast(err.message || 'Banner upload failed', 'error');
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeBanner = () => {
    setBannerUrl('');
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOffers(data || []);
    } catch (err) {
      console.error('Error fetching offers:', err);
      showToast(err.message || 'Error loading campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingOffer(null);
    setTitle('');
    setMessage('');
    setDiscountPercent('');
    setIsActive(false);
    setStartDate('');
    setEndDate('');
    setBannerUrl('');
    setCategoryId('');
    setCategoryName('All');
    setShowForm(true);
  };

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    setTitle(offer.title || '');
    setMessage(offer.message || '');
    setDiscountPercent(offer.discount_percent ?? '');
    setIsActive(offer.is_active ?? false);
    setBannerUrl(offer.banner_url || '');
    setCategoryId(offer.category_id || '');
    setCategoryName(offer.category_name || 'All');
    
    // Format dates to YYYY-MM-DDTHH:MM for datetime-local inputs
    const formatDateTime = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    
    setStartDate(formatDateTime(offer.start_date));
    setEndDate(formatDateTime(offer.end_date));
    setShowForm(true);
  };

  const handleToggleActive = async (offer) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: !offer.is_active })
        .eq('id', offer.id);
      
      if (error) throw error;

      await adminLogService.logAction(
        !offer.is_active ? 'activated_offer' : 'deactivated_offer',
        'offers',
        offer.id,
        { title: offer.title, discount_percent: offer.discount_percent }
      );

      showToast(`Campaign ${!offer.is_active ? 'Activated' : 'Deactivated'}`, 'success');
      await fetchOffers();
    } catch (err) {
      console.error('Error toggling offer status:', err);
      showToast('Error updating campaign status', 'error');
    }
  };

  const handleDelete = async (id) => {
    setDeletingOffer(true);
    try {
      const offer = offers.find(o => o.id === id);
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id);
      if (error) throw error;

      await adminLogService.logAction('deleted_offer', 'offers', id, {
        title: offer?.title,
        discount_percent: offer?.discount_percent
      });

      showToast('Offer campaign deleted', 'success');
      await fetchOffers();
    } catch (err) {
      console.error('Error deleting offer:', err);
      showToast('Failed to delete campaign', 'error');
    } finally {
      setDeletingOffer(false);
      setDeleteOfferId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !discountPercent) {
      showToast('Please fill out all required fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        message,
        discount_percent: Number(discountPercent),
        is_active: isActive,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        banner_url: bannerUrl || null,
        category_id: categoryId || null,
        category_name: categoryName,
      };

      if (editingOffer) {
        // Update
        const { error } = await supabase
          .from('offers')
          .update(payload)
          .eq('id', editingOffer.id);
        if (error) throw error;

        await adminLogService.logAction('updated_offer', 'offers', editingOffer.id, {
          title,
          discount_percent: payload.discount_percent
        });

        showToast('Campaign updated successfully!', 'success');
      } else {
        // Create
        const { data: newOffers, error } = await supabase
          .from('offers')
          .insert(payload)
          .select();

        const newOffer = newOffers?.[0] || null;
        if (error) throw error;

        await adminLogService.logAction('created_offer', 'offers', newOffer?.id, {
          title,
          discount_percent: payload.discount_percent
        });

        showToast('Campaign created successfully!', 'success');
      }

      setShowForm(false);
      await fetchOffers();
    } catch (err) {
      console.error('Error saving offer campaign:', err);
      showToast(err.message || 'Error saving campaign', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-white max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Promotional Campaigns</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Configure store banners, sales badges, and discount campaigns.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-pink-600 hover:from-primary-700 hover:to-pink-700 text-white font-bold text-sm shadow-md transition duration-200"
          >
            <Plus size={16} className="mr-2" />
            Add Offer
          </button>
        )}
      </div>

      {/* Campaign Form (Modal or Inline container) */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">
              {editingOffer ? 'Edit Promo Campaign' : 'Create Promo Campaign'}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Offer Title *"
                id="title"
                placeholder="e.g. Summer Solstice Sale"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
              />

              <Input
                label="Discount Percent (%) *"
                id="discountPercent"
                type="number"
                placeholder="20"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  Target Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setCategoryId(id);
                    const selected = categories.find((c) => c.id === id);
                    setCategoryName(selected ? selected.name : 'All');
                  }}
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:border-[#ff2a85] transition-colors"
                >
                  <option value="">All Categories (Store-wide)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Promo Banner Message (Visible to customers)"
                id="message"
                placeholder="🔥 Summer Sale: Flat 20% off on premium collections!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Banner Image Upload Section */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-400 block">
                Promo Banner Background Image (Optional)
              </span>
              <div className="flex items-center gap-4">
                {bannerUrl ? (
                  <div className="relative h-32 w-full max-w-md rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 group">
                    <img src={bannerUrl} alt="Offer Banner" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-650 text-white rounded-lg transition"
                      title="Remove Banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 w-full max-w-md border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#ff2a85] dark:hover:border-[#ff2a85] rounded-2xl cursor-pointer group bg-slate-50/50 dark:bg-slate-950/30 transition-colors">
                    {uploadingBanner ? (
                      <Loader2 className="animate-spin text-[#ff2a85] h-6 w-6" />
                    ) : (
                      <>
                        <Plus size={22} className="text-slate-450 group-hover:text-[#ff2a85] transition-colors" />
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-2">
                          Upload Banner Image
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={uploadingBanner}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Campaign Start Date"
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={submitting}
              />

              <Input
                label="Campaign End Date"
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="flex items-center space-x-3 py-2">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={submitting}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff2a85]"></div>
                <span className="ml-3 text-sm font-semibold text-slate-700 dark:text-slate-350">
                  Active immediately (Display banner on frontend)
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={submitting}
              >
                Save Campaign
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-450">Loading campaigns...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="py-20 text-center text-slate-450 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
          No promotional campaigns configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((off) => {
            const hasStarted = off.start_date ? new Date(off.start_date) <= new Date() : true;
            const hasEnded = off.end_date ? new Date(off.end_date) < new Date() : false;
            const statusColor = off.is_active && hasStarted && !hasEnded
              ? 'border-[#ff2a85] bg-red-50/10'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
            return (
              <div
                key={off.id}
                className={`p-6 border rounded-3xl flex flex-col justify-between shadow-sm transition-all duration-300 ${statusColor}`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-red-50 dark:bg-red-950/20 text-[#ff2a85] rounded-xl shrink-0">
                        <Gift size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base leading-tight">{off.title}</h3>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {off.discount_percent}% Discount Campaign
                        </span>
                        <span className="text-[9px] uppercase font-extrabold text-[#ff2a85] bg-[#ff2a85]/10 px-2 py-0.5 rounded-md mt-1 inline-block">
                          Category: {off.category_name || 'All'}
                        </span>
                      </div>
                    </div>
                    {/* Active toggle button */}
                    <button
                      onClick={() => handleToggleActive(off)}
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        off.is_active
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {off.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {off.message && (
                    <p className="text-xs font-semibold bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 p-2.5 rounded-xl text-slate-600 dark:text-slate-350">
                      {off.message}
                    </p>
                  )}

                  {off.banner_url && (
                    <div className="h-20 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-105 dark:bg-slate-950 mt-2">
                      <img src={off.banner_url} alt="Banner Preview" className="object-cover w-full h-full" />
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center text-[10px] text-slate-400 font-bold space-x-4 pt-1">
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>Starts: {off.start_date ? new Date(off.start_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>Ends: {off.end_date ? new Date(off.end_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center space-x-2 border-t border-slate-100 dark:border-slate-800 mt-4 pt-3.5">
                  <button
                    onClick={() => handleOpenEdit(off)}
                    className="p-2 rounded-xl text-slate-450 hover:text-[#ff2a85] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-xs font-bold inline-flex items-center"
                  >
                    <Edit2 size={14} className="mr-1.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteOfferId(off.id)}
                    className="p-2 rounded-xl text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-xs font-bold inline-flex items-center"
                  >
                    <Trash2 size={14} className="mr-1.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Premium Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteOfferId}
        onClose={() => setDeleteOfferId(null)}
        onConfirm={() => handleDelete(deleteOfferId)}
        title="Delete Offer Campaign?"
        message="Are you sure you want to delete this offer? Linked products will have their campaign links removed."
        confirmLabel="Delete"
        cancelLabel="Keep Campaign"
        type="danger"
        isLoading={deletingOffer}
      />
    </div>
  );
};

export default AdminOffersPage;
