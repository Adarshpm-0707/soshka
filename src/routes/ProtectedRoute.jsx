import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Reusable/Loader';

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!user) {
    // Save the location the user was trying to access so we can redirect them back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect administrators to their respective dashboards
  if (profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (profile?.role === 'superadmin') {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
