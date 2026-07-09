import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/Reusable/Loader';

const SuperAdminLogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
      } catch (err) {
        console.error('Super Admin sign out failed:', err);
      } finally {
        navigate('/superadmin/login', { replace: true });
      }
    };

    handleLogout();
  }, [logout, navigate]);

  return <Loader fullScreen text="Signing out from Super Admin portal..." />;
};

export default SuperAdminLogoutPage;
