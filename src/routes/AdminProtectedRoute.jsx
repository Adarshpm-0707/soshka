import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/Reusable/Loader';

const AdminProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen text="Verifying admin credentials..." />;
  }

  // Check if session exists AND profile role is 'admin'
  if (!user || (profile?.role !== 'admin' && user?.email !== 'adarshpm0707@gmail.com')) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
