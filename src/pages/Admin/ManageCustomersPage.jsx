import React, { useEffect, useState } from 'react';
import { customerService } from '../../services/customerService';
import {
  Users,
  Search,
  Trash2,
  AlertTriangle,
  Loader2,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { showToast } from '../../components/Reusable/Toast';

const ManageCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.fetchAllCustomers();
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load customers catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase().trim();
    if (!term) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phone?.toLowerCase().includes(term)
      );
      setFilteredCustomers(filtered);
    }
  }, [search, customers]);

  const handleDeleteClick = (customer) => {
    setDeleteConfirmId(customer.id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    try {
      await customerService.deleteCustomer(deleteConfirmId);
      showToast('Customer deleted successfully.', 'success');
      setCustomers((prev) => prev.filter((c) => c.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to delete customer profile.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="crm-body space-y-6 animate-fade-in p-2 sm:p-4 text-slate-800 dark:text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight crm-font-serif text-[#5C0F26] dark:text-[#E8C9A8]">
            Customer Management
          </h1>
          <p className="text-slate-550 dark:text-slate-455 text-xs tracking-wider uppercase mt-1">
            Browse and regulate Sõshka buyer directory
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer name, email or phone..."
          className="w-full bg-[#F5E6EC]/40 dark:bg-[#1c1c1e] border border-[#E5C4CE] dark:border-[#2c2c2e] focus:border-[#8B1A3A] dark:focus:border-[#ff2a85] text-slate-800 dark:text-white rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none transition-colors placeholder:text-slate-400"
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-[#1c1c1e] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6 text-slate-800 dark:text-white">
            <div className="flex items-center space-x-3 text-red-655 dark:text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Remove Customer?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Are you sure you want to permanently delete this customer's profile? This will immediately revoke their access and clean all associated profile records.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deletingId}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId}
                className="px-5 py-2.5 rounded-xl bg-[#8B1A3A] dark:bg-red-650 hover:opacity-90 text-white font-bold text-sm transition flex items-center"
              >
                {deletingId && <Loader2 size={14} className="animate-spin mr-2" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-[#1c1c1e] rounded-3xl shadow-sm">
          <Loader2 className="animate-spin text-[#8B1A3A] dark:text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-400">Fetching buyer records...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-[#1c1c1e] rounded-3xl shadow-sm font-semibold text-xs">
          No matches found for "{search}".
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#0c0c0d] border border-[#E5C4CE] dark:border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5E6EC]/60 dark:bg-slate-900/50 border-b border-[#E5C4CE] dark:border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-[#7A3D52] dark:text-slate-400">
                  <th className="py-4 px-6">Buyer details</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Last Updated</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5C4CE]/50 dark:divide-[#1c1c1e] text-sm font-semibold">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {customer.avatar_url ? (
                          <img
                            src={customer.avatar_url}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover border border-[#E5C4CE] dark:border-[#1c1c1e]"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-[#F5E6EC] dark:bg-slate-800 border border-[#E5C4CE] dark:border-[#1c1c1e] flex items-center justify-center font-black text-[#8B1A3A] dark:text-slate-300 text-xs">
                            {(customer.name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-slate-800 dark:text-slate-100 font-bold block leading-snug">
                            {customer.name || 'Anonymous Client'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block">{customer.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-350 font-mono">
                      {customer.phone || '—'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center">
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
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

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white dark:bg-[#0c0c0d] border border-[#E5C4CE] dark:border-[#1c1c1e] rounded-2xl p-4 shadow-sm space-y-4"
              >
                <div className="flex items-center space-x-3">
                  {customer.avatar_url ? (
                    <img
                      src={customer.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover border border-[#E5C4CE] dark:border-[#1c1c1e]"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#F5E6EC] dark:bg-slate-800 border border-[#E5C4CE] dark:border-[#1c1c1e] flex items-center justify-center font-black text-[#8B1A3A] dark:text-slate-300 text-sm">
                      {(customer.name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-800 dark:text-slate-100 font-bold block truncate leading-snug">
                      {customer.name || 'Anonymous Client'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">
                      {customer.email}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(customer)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-red-505 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all shrink-0"
                    title="Delete Customer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-[#E5C4CE]/50 dark:border-[#1c1c1e] pt-3 text-[10px] uppercase tracking-wider font-extrabold text-slate-450 dark:text-slate-500">
                  <div>
                    <span className="block text-slate-400 dark:text-slate-600 text-[8px]">Phone</span>
                    <span className="block text-slate-655 dark:text-slate-350 font-mono mt-0.5">{customer.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 dark:text-slate-600 text-[8px]">Last Updated</span>
                    <span className="block text-slate-655 dark:text-slate-350 font-mono mt-0.5">
                      {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ManageCustomersPage;
