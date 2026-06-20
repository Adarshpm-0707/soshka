import { useState, useCallback } from 'react';
import { superadminService } from '../services/superadminService';
import { showToast } from '../components/Reusable/Toast';

export const useSuperAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await superadminService.fetchAllAdmins();
      setAdmins(data);
      return data;
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Failed to fetch admins', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAdmin = useCallback(async (adminData) => {
    setLoading(true);
    setError(null);
    try {
      const newAdmin = await superadminService.createAdmin(adminData);
      setAdmins((prev) => [newAdmin, ...prev]);
      showToast('Admin created successfully', 'success');
      return newAdmin;
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Failed to create admin', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAdminActive = useCallback(async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await superadminService.toggleAdminActive(id, status);
      setAdmins((prev) =>
        prev.map((adm) => (adm.id === id ? { ...adm, is_active: status } : adm))
      );
      showToast(`Admin ${status ? 'activated' : 'deactivated'} successfully`, 'success');
      return updated;
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Failed to toggle status', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAdminRole = useCallback(async (id, role) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await superadminService.updateAdminRole(id, role);
      setAdmins((prev) =>
        prev.map((adm) => (adm.id === id ? { ...adm, role: role } : adm))
      );
      showToast(`Admin role updated to ${role} successfully`, 'success');
      return updated;
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Failed to update admin role', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAdmin = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await superadminService.deleteAdmin(id);
      setAdmins((prev) => prev.filter((adm) => adm.id !== id));
      showToast('Admin deleted successfully', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Failed to delete admin', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    admins,
    loading,
    error,
    fetchAdmins,
    createAdmin,
    toggleAdminActive,
    updateAdminRole,
    deleteAdmin
  };
};