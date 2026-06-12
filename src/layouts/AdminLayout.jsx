import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, ShoppingBag, Layers, BadgePercent, Package, ArrowLeft, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = profile?.role === 'admin' || user?.email === 'adarshpm0707@gmail.com';

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

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: ShoppingBag },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Offers', path: '/admin/offers', icon: BadgePercent },
    { label: 'Orders', path: '/admin/orders', icon: Package },
  ];

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-4 shadow-sm z-30">
        <div>
          <div className="flex items-center space-x-2 px-2 py-4 mb-6">
            <ShoppingBag className="text-[#ff2a85] h-8 w-8" />
            <span className="text-xl font-bold font-sans tracking-wide">Soshka Admin</span>
          </div>
          
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');
              return (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition duration-200 ${
                    isActive 
                      ? 'bg-red-50/50 dark:bg-red-950/20 text-[#ff2a85] font-bold border border-red-500/10' 
                      : 'text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[#ff2a85]' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-4" />

            <Link 
              to="/" 
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-200"
            >
              <ArrowLeft size={18} className="text-slate-400" />
              <span>Back to Store</span>
            </Link>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 px-2">
          <div className="flex items-center space-x-3 mb-4">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="h-9 w-9 rounded-full object-cover border border-slate-300 dark:border-slate-700" 
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-750 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-300 border border-slate-300 dark:border-slate-700 uppercase">
                {(profile?.name || 'A').charAt(0)}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{profile?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              await logout();
              navigate('/admin/login');
            }}
            className="flex items-center space-x-2 w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2.5 rounded-lg transition text-sm font-semibold"
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
