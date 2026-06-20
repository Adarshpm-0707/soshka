import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Reusable/Loader';

const SuperAdminProtectedRoute = ({ children }) => {
  const { user, profile, loading, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen text="Verifying super admin credentials..." />;
  }

  // Check if session exists AND profile is superadmin AND is active
  if (!user || !isSuperAdmin) {
    return <Navigate to="/superadmin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default SuperAdminProtectedRoute;
