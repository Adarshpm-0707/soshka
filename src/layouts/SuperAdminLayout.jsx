import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Shield,
  ShoppingBag,
  Package,
  CreditCard,
  Activity,
  ArrowLeft,
  LogOut,
  Crown,
  Users,
  Menu,
  X,
  DollarSign
} from 'lucide-react';

const SuperAdminLayout = () => {
  const { user, profile, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-950 text-slate-100">
        <h1 className="text-3xl font-extrabold text-red-500 mb-4 font-mono">Access Denied</h1>
        <p className="max-w-md mb-6 text-slate-400">
          This panel is restricted to Super Administrator accounts only. Your account ({user?.email}) does not have permission.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center px-4 py-2 text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Store
        </button>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard },
    { label: 'Manage Admins', path: '/superadmin/admins', icon: Shield },
    { label: 'Manage Customers', path: '/superadmin/customers', icon: Users },
    { label: 'Products', path: '/superadmin/products', icon: ShoppingBag },
    { label: 'Orders Registry', path: '/superadmin/orders', icon: Package },
    { label: 'Payment Settings', path: '/superadmin/payments', icon: CreditCard },
    { label: 'Profit & Loss', path: '/superadmin/pandl', icon: DollarSign },
    { label: 'Activity Logs', path: '/superadmin/logs', icon: Activity },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 transition-colors duration-300">
      
      {/* Mobile Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0c0c0d] border-b border-[#1c1c1e] md:hidden z-20 shrink-0">
        <div className="flex items-center space-x-2">
          <Crown className="text-[#ff2a85] h-6 w-6" />
          <span className="text-base font-black tracking-wide bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Soshka Super</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1 text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay for Mobile Drawer */}
        {isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
          />
        )}

        {/* Super Admin Sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0c0c0d] border-r border-[#1c1c1e] flex flex-col justify-between p-4 shadow-sm z-40 transition-transform duration-300 md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div>
            <div className="flex items-center justify-between px-2 py-4 mb-6">
              <div className="flex items-center space-x-2">
                <Crown className="text-[#ff2a85] h-8 w-8" />
                <span className="text-xl font-black font-sans tracking-wide bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Soshka Super</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white md:hidden transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/superadmin/dashboard' && location.pathname === '/superadmin');
                return (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition duration-200 ${
                      isActive 
                        ? 'bg-[#ff2a85]/10 text-[#ff2a85] font-bold border border-[#ff2a85]/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#ff2a85]' : 'text-slate-500'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="h-[1px] bg-[#1c1c1e] my-4" />

              <Link 
                to="/" 
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-350 hover:bg-white/5 transition duration-200"
              >
                <ArrowLeft size={18} className="text-slate-500" />
                <span>Back to Store</span>
              </Link>
            </nav>
          </div>

          {/* Footer actions */}
          <div className="border-t border-[#1c1c1e] pt-4 px-2">
            <div className="flex items-center space-x-3 mb-4">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="h-9 w-9 rounded-full object-cover border border-[#1c1c1e]" 
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 border border-[#1c1c1e] uppercase">
                  {(profile?.name || 'S').charAt(0)}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{profile?.name || 'Super Admin'}</p>
                <p className="text-xs text-slate-500 truncate text-ellipsis">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                await logout();
                navigate('/superadmin/login');
              }}
              className="flex items-center space-x-2 w-full text-left text-red-500 hover:bg-red-950/20 px-3 py-2.5 rounded-lg transition text-sm font-semibold"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Admin Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
