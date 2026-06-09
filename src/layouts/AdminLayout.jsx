import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, ShoppingBag, Users, ArrowLeft, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  // Simple admin check: email contains 'admin'
  const isAdmin = user?.email?.includes('admin');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        <h1 className="text-3xl font-extrabold text-red-500 mb-4 font-mono">Access Denied</h1>
        <p className="max-w-md mb-6 text-slate-600 dark:text-slate-400">
          This panel is restricted to admin accounts only. Your account ({user?.email}) does not have permission.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Store
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-850 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center space-x-2 px-2 py-4 mb-6">
            <ShoppingBag className="text-primary-600 h-8 w-8" />
            <span className="text-xl font-bold font-sans tracking-wide">Soshka Admin</span>
          </div>
          
          <nav className="space-y-1">
            <Link 
              to="/admin" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/admin/products" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ShoppingBag size={20} />
              <span>Products</span>
            </Link>
            <Link 
              to="/" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft size={20} />
              <span>Back to Store</span>
            </Link>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 px-2">
          <div className="flex items-center space-x-3 mb-4">
            <img 
              src={profile?.avatar_url || 'https://via.placeholder.com/150'} 
              alt="Avatar" 
              className="h-9 w-9 rounded-full object-cover border border-slate-300 dark:border-slate-700" 
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{profile?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center space-x-2 w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-lg transition text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
