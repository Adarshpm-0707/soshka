import React, { useEffect, useState } from 'react';
import { customerService } from '../../services/customerService';
import {
  Users,
  Search,
  Trash2,
  AlertTriangle,
  Loader2,
  Calendar,
  Mail,
  UserX
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
      showToast(err.message || 'Failed to retrieve customers list.', 'error');
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
      showToast('Customer profile permanently deleted.', 'info');
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
    <div className="space-y-6 text-white max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Customers Directory</h1>
          <p className="text-slate-450 text-xs mt-1 font-semibold">
            Monitor registered buyer accounts, search metadata, and purge inactive profiles.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full bg-[#0c0c0d] border border-[#1c1c1e] focus:border-[#ff2a85] text-white rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none transition-colors placeholder:text-slate-600"
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0d] border border-[#1c1c1e] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6 text-white">
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Delete Customer Account?</h3>
            </div>
            <p className="text-sm text-slate-450 leading-relaxed font-semibold">
              Are you sure you want to permanently delete this customer profile? This action will revoke their login rights, purge their records, and cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deletingId}
                className="px-4 py-2 rounded-xl text-slate-450 hover:bg-white/5 font-bold text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId}
                className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-750 text-white font-bold text-sm transition flex items-center"
              >
                {deletingId && <Loader2 size={14} className="animate-spin mr-2" />}
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customers List Section */}
      {loading && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm">
          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-400">Loading customers directory...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm font-semibold text-xs">
          {search ? 'No customers match your search criteria.' : 'No registered customers found in database.'}
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden">
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
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {customer.avatar_url ? (
                          <img
                            src={customer.avatar_url}
                            alt="Avatar"
                            className="h-9 w-9 rounded-full object-cover border border-[#1c1c1e]"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-slate-800 border border-[#1c1c1e] flex items-center justify-center font-black text-slate-350 text-xs uppercase">
                            {customer.name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <span className="text-slate-100 font-bold block leading-snug">
                            {customer.name || 'Anonymous User'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block">{customer.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-300 font-mono">
                      {customer.phone || '—'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center items-center">
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-950/20 transition-all"
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

          {/* Mobile Cards View (< 768px) */}
          <div className="md:hidden space-y-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-2xl p-4 shadow-sm space-y-4"
              >
                <div className="flex items-center space-x-3">
                  {customer.avatar_url ? (
                    <img
                      src={customer.avatar_url}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full object-cover border border-[#1c1c1e]"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-800 border border-[#1c1c1e] flex items-center justify-center font-black text-slate-350 text-sm uppercase">
                      {customer.name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-100 font-bold block truncate leading-snug">
                      {customer.name || 'Anonymous User'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">
                      {customer.email}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(customer)}
                    className="p-2.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-950/20 transition-all shrink-0"
                    title="Delete Customer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-[#1c1c1e] pt-3 text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                  <div>
                    <span className="block text-slate-600 text-[8px]">Phone</span>
                    <span className="block text-slate-350 font-mono mt-0.5">{customer.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-600 text-[8px]">Last Updated</span>
                    <span className="block text-slate-350 font-mono mt-0.5">
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
