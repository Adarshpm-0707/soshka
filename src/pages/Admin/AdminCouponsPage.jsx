import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Ticket, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { couponService } from '../../services/couponService';
import { adminLogService } from '../../services/adminLogService';
import Button from '../../components/Reusable/Button';
import Input from '../../components/Reusable/Input';
import Modal from '../../components/Reusable/Modal';
import ConfirmModal from '../../components/Reusable/ConfirmModal';
import Badge from '../../components/Reusable/Badge';
import SectionTitle from '../../components/Reusable/SectionTitle';
import { showToast } from '../../components/Reusable/Toast';
import { formatCurrency } from '../../utils/formatCurrency';

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteCouponId, setDeleteCouponId] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch Coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await couponService.fetchAllCoupons();
      setCoupons(data || []);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      showToast(err.message || 'Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddModal = () => {
    setEditingCoupon(null);
    setCode('');
    setType('percentage');
    setValue('');
    setMinOrderAmount('0');
    setMaxUses('');
    setExpiresAt('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code || '');
    setType(coupon.type || 'percentage');
    setValue(coupon.value !== undefined ? String(coupon.value) : '');
    setMinOrderAmount(coupon.min_order_amount !== undefined ? String(coupon.min_order_amount) : '0');
    setMaxUses(coupon.max_uses !== null && coupon.max_uses !== undefined ? String(coupon.max_uses) : '');
    setExpiresAt(coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '');
    setIsActive(coupon.is_active ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Coupon code is required', 'error');
      return;
    }
    if (!value || Number(value) <= 0) {
      showToast('Please enter a valid coupon value', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        min_order_amount: minOrderAmount !== '' ? Number(minOrderAmount) : 0,
        max_uses: maxUses !== '' ? parseInt(maxUses, 10) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: isActive,
      };

      if (editingCoupon) {
        const updated = await couponService.updateCoupon(editingCoupon.id, payload);
        await adminLogService.logAction('updated_coupon', 'coupons', editingCoupon.id, {
          code: updated.code,
          type: updated.type,
          value: updated.value
        });
        showToast('Coupon updated successfully!', 'success');
      } else {
        const created = await couponService.createCoupon(payload);
        await adminLogService.logAction('created_coupon', 'coupons', created.id, {
          code: created.code,
          type: created.type,
          value: created.value
        });
        showToast('Coupon created successfully!', 'success');
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      console.error('Error saving coupon:', err);
      showToast(err.message || 'Failed to save coupon', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const updatedStatus = !coupon.is_active;
      await couponService.updateCoupon(coupon.id, { is_active: updatedStatus });
      await adminLogService.logAction('updated_coupon', 'coupons', coupon.id, {
        code: coupon.code,
        is_active: updatedStatus
      });
      showToast(`Coupon set to ${updatedStatus ? 'Active' : 'Inactive'}`, 'info');
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: updatedStatus } : c));
    } catch (err) {
      console.error('Error toggling coupon status:', err);
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteCouponId) return;
    setDeletingCoupon(true);
    try {
      const target = coupons.find(c => c.id === deleteCouponId);
      await couponService.deleteCoupon(deleteCouponId);
      await adminLogService.logAction('deleted_coupon', 'coupons', deleteCouponId, {
        code: target?.code
      });
      showToast('Coupon deleted successfully', 'info');
      setCoupons(prev => prev.filter(c => c.id !== deleteCouponId));
    } catch (err) {
      console.error('Error deleting coupon:', err);
      showToast(err.message || 'Failed to delete coupon', 'error');
    } finally {
      setDeletingCoupon(false);
      setDeleteCouponId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionTitle
          title="Coupon Management"
          subtitle="Create, edit, activate, or retire promotional discount codes."
          align="left"
        />
        <Button onClick={openAddModal} className="flex items-center justify-center space-x-2 w-full sm:w-auto">
          <Plus size={18} />
          <span>Add New Coupon</span>
        </Button>
      </div>

      {/* Coupon List Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full mb-3">
              <Ticket size={36} />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No coupons found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Click the "Add New Coupon" button to create your first discount code.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile / Tablet Cards View (Visible on screens < 1024px) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4 p-4">
              {coupons.map((coupon) => {
                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                return (
                  <div key={coupon.id} className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 tracking-wider">
                        {coupon.code}
                      </span>
                      {isExpired ? (
                        <Badge status="cancelled" className="text-[10px]">Expired</Badge>
                      ) : coupon.is_active ? (
                        <Badge status="delivered" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge status="pending" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase block tracking-wider">Discount</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${formatCurrency(coupon.value)} OFF`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase block tracking-wider">Min Order</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {coupon.min_order_amount > 0 ? formatCurrency(coupon.min_order_amount) : 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase block tracking-wider">Uses</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                          {coupon.used_count || 0} <span className="text-slate-400 font-normal">/ {coupon.max_uses ?? '∞'}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase block tracking-wider">Expires</span>
                        <span className={`text-slate-600 dark:text-slate-300 ${isExpired ? 'text-red-500 font-bold' : ''}`}>
                          {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'No Expiry'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200/80 dark:border-slate-700/60">
                      <button
                        onClick={() => handleToggleStatus(coupon)}
                        className={`p-2 rounded-lg transition ${
                          coupon.is_active
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={coupon.is_active ? 'Deactivate Coupon' : 'Activate Coupon'}
                      >
                        {coupon.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => openEditModal(coupon)}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        title="Edit Coupon"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteCouponId(coupon.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                        title="Delete Coupon"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Visible on screens >= 1024px) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Value</th>
                    <th className="px-6 py-4">Min Order</th>
                    <th className="px-6 py-4">Uses (Used / Max)</th>
                    <th className="px-6 py-4">Expires</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                  {coupons.map((coupon) => {
                    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                    return (
                      <tr key={coupon.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-black uppercase text-primary-600 dark:text-primary-400 tracking-wider">
                          {coupon.code}
                        </td>
                        <td className="px-6 py-4 capitalize text-xs">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                            {coupon.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          {coupon.min_order_amount > 0 ? formatCurrency(coupon.min_order_amount) : '₹0 (None)'}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{coupon.used_count || 0}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-slate-500">{coupon.max_uses !== null && coupon.max_uses !== undefined ? coupon.max_uses : '∞'}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {coupon.expires_at ? (
                            <span className={isExpired ? 'text-red-500 font-bold' : ''}>
                              {new Date(coupon.expires_at).toLocaleDateString()} {new Date(coupon.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-slate-400">No Expiry</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isExpired ? (
                            <Badge status="cancelled" className="text-[10px]">Expired</Badge>
                          ) : coupon.is_active ? (
                            <Badge status="delivered" className="text-[10px]">Active</Badge>
                          ) : (
                            <Badge status="pending" className="text-[10px]">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleStatus(coupon)}
                            className={`p-1.5 rounded-lg transition ${
                              coupon.is_active
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title={coupon.is_active ? 'Deactivate Coupon' : 'Activate Coupon'}
                          >
                            {coupon.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Edit Coupon"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteCouponId(coupon.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                            title="Delete Coupon"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Coupon Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. SAVE20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="uppercase font-mono font-bold tracking-wider"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Value {type === 'percentage' ? '(%)' : '(₹)'} <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder={type === 'percentage' ? '20' : '200'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Min Order Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Min Order Amount (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0 for no minimum"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
              />
            </div>

            {/* Max Uses */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Max Uses (Empty = Unlimited)
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
          </div>

          {/* Expires At */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Expiration Date & Time (Optional)
            </label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center space-x-3 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-700 cursor-pointer"
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Active Coupon (Available for users to apply)
            </label>
          </div>

          {/* Modal Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center space-x-1">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteCouponId}
        onClose={() => setDeleteCouponId(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? Users will no longer be able to apply it."
        confirmText="Delete Coupon"
        danger
        loading={deletingCoupon}
      />
    </div>
  );
};

export default AdminCouponsPage;
