import React, { useEffect, useState } from 'react';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserMinus,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Award,
  ChevronDown,
  Trash2,
  Plus,
  AlertTriangle
} from 'lucide-react';
import Badge from '../../components/Reusable/Badge';
import { showToast } from '../../components/Reusable/Toast';

const ManageAdminsPage = () => {
  const { admins, loading, fetchAdmins, toggleAdminActive, updateAdminRole, deleteAdmin } = useSuperAdmin();
  const { profile: currentProfile } = useAuth();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleToggleStatus = async (admin) => {
    if (admin.id === currentProfile?.id) {
      showToast('You cannot deactivate your own super administrator session!', 'warning');
      return;
    }
    try {
      await toggleAdminActive(admin.id, !admin.is_active);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (admin, newRole) => {
    if (admin.id === currentProfile?.id) {
      showToast('You cannot change your own super administrator role privilege!', 'warning');
      return;
    }
    try {
      await updateAdminRole(admin.id, newRole);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (admin) => {
    if (admin.id === currentProfile?.id) {
      showToast('You cannot delete your own super administrator profile!', 'warning');
      return;
    }
    setDeleteConfirmId(admin.id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    try {
      await deleteAdmin(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 text-white max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Administrators Directory</h1>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Provision roles, suspension profiles, and authorization tokens for Soshka staff.
          </p>
        </div>
        <Link
          to="/superadmin/admins/new"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2a85] to-purple-650 hover:from-pink-650 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-pink-500/10 transition duration-200"
        >
          <Plus size={16} className="mr-2" />
          Add Administrator
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0d] border border-[#1c1c1e] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6 text-white">
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Remove Administrator Profile?</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this administrator profile? This action will revoke their login rights and cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deletingId}
                className="px-4 py-2 rounded-xl text-slate-450 hover:bg-white/5 font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId}
                className="px-4.5 py-2.5 rounded-xl bg-red-650 hover:bg-red-750 text-white font-bold text-sm transition flex items-center"
              >
                {deletingId && <Loader2 size={14} className="animate-spin mr-2" />}
                Revoke Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admins Table */}
      {loading && admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c0c0d] border border-[#1c1c1e] rounded-2xl shadow-sm">
          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-400">Loading administrators directory...</p>
        </div>
      ) : admins.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-[#0c0c0d] border border-[#1c1c1e] rounded-2xl shadow-sm">
          No administrative accounts found.
        </div>
      ) : (
        <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  <th className="py-4 px-6">Staff Member</th>
                  <th className="py-4 px-6">System Role</th>
                  <th className="py-4 px-6">Account Status</th>
                  <th className="py-4 px-6">Last Updated</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1e] text-sm font-semibold">
                {admins.map((admin) => {
                  const isSelf = admin.id === currentProfile?.id;
                  return (
                    <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-full bg-slate-800 border border-[#1c1c1e] flex items-center justify-center font-black text-slate-350 text-xs uppercase">
                            {admin.name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <span className="text-slate-100 font-bold block leading-snug">
                              {admin.name || 'Staff User'} {isSelf && <span className="text-[10px] text-[#ff2a85] bg-pink-950/40 border border-pink-500/10 px-1.5 py-0.5 rounded-md font-extrabold ml-1.5">You</span>}
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal block">{admin.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <select
                            value={admin.role}
                            disabled={isSelf}
                            onChange={(e) => handleRoleChange(admin, e.target.value)}
                            className="bg-slate-900 border border-[#26262a] focus:border-[#ff2a85] text-slate-300 rounded-lg text-xs font-semibold px-2 py-1 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="admin">Administrator</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          disabled={isSelf}
                          className="flex items-center gap-1.5 text-xs font-extrabold disabled:opacity-50"
                        >
                          {admin.is_active !== false ? (
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
                        {admin.updated_at ? new Date(admin.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center items-center">
                          <button
                            onClick={() => handleDeleteClick(admin)}
                            disabled={isSelf}
                            className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-950/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete Admin Account"
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

export default ManageAdminsPage;