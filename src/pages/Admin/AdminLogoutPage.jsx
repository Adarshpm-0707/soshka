import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/Reusable/Loader';

const AdminLogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
      } catch (err) {
        console.error('Admin sign out failed:', err);
      } finally {
        navigate('/admin/login', { replace: true });
      }
    };

    handleLogout();
  }, [logout, navigate]);

  return <Loader fullScreen text="Signing out from Admin portal..." />;
};

export default AdminLogoutPage;
