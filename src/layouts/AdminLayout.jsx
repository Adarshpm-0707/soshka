import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Layers, 
  BadgePercent, 
  Package, 
  ArrowLeft, 
  LogOut,
  Users,
  Menu,
  X,
  Star,
  RefreshCw,
  Ticket
} from 'lucide-react';

const AdminLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin' || user?.email === 'adarshpm0707@gmail.com' || user?.email === 'soshka.in@gmail.com';

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
    { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
    { label: 'Orders', path: '/admin/orders', icon: Package },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Store Reviews', path: '/admin/reviews', icon: Star },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Mobile Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 md:hidden z-20 shrink-0">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="text-[#ff2a85] h-6 w-6" />
          <span className="text-base font-bold tracking-wide">Soshka Admin</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            title="Refresh Panel"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay for Mobile Drawer */}
        {isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}

        {/* Admin Sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-4 shadow-sm z-40 transition-transform duration-300 md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div>
            <div className="flex items-center justify-between px-2 py-4 mb-6">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="text-[#ff2a85] h-8 w-8" />
                <span className="text-xl font-bold font-sans tracking-wide">Soshka Admin</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-655 dark:hover:text-white md:hidden transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');
                return (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition duration-200 ${
                      isActive 
                        ? 'bg-red-50/50 dark:bg-red-950/20 text-[#ff2a85] font-bold border border-red-500/10' 
                        : 'text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800'
                     }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#ff2a85]' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-4" />

              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-200 w-full text-left"
              >
                <RefreshCw size={18} className="text-slate-400" />
                <span>Refresh Panel</span>
              </button>

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
                <p className="text-xs text-slate-400 truncate">{user?.email?.replace(/\+(admin|superadmin)@/, '@')}</p>
              </div>
            </div>
            <Link 
              to="/admin/logout"
              className="flex items-center space-x-2 w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2.5 rounded-lg transition text-sm font-semibold"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </Link>
          </div>
        </aside>

        {/* Main Admin Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
