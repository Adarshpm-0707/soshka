import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, Heart, User, LogOut, ChevronDown, LayoutDashboard, Search, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWishlist } from '../../hooks/useWishlist';
import NavLinks from './NavLinks';
import CartIcon from './CartIcon';

const Navbar = () => {
  const { user, profile, logout, isAdmin, isSuperAdmin } = useAuth();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();

  const theme = 'dark';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Scroll listener for shadow depth
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside listener for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileDropdownOpen(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

  const wishlistCount = wishlistItems.length;

  return (
    <>
      {/* ── Main Navbar ── */}
      <header
        className={`sticky top-0 z-40 w-full transition-shadow duration-300 ${
          isScrolled ? 'shadow-[0_4px_32px_rgba(0,0,0,0.45)]' : 'shadow-none'
        }`}
        style={{ background: '#98183f' }}
      >
        {/* Top accent line */}
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #db4268 0%, #ff8da1 50%, #db4268 100%)' }} />

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-[68px]">

          {/* ── Left: Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group"
          >
           
            <span
              className="text-2xl font-medium tracking-tight leading-none select-none text-white"
              style={{ fontFamily: "'TT Drugs'", letterSpacing: '-0.5px' }}
            >
              Sõshka
            </span>
          </Link>

          {/* ── Center: Desktop Nav Links ── */}
          <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <NavLinks />
          </nav>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-1">

            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden lg:block p-2.5 rounded-lg text-rose-100 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Search"
            >
              <Search size={19} />
            </button>


            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="hidden lg:block relative p-2.5 rounded-lg text-rose-100 hover:text-rose-250 hover:bg-white/10 transition-all duration-200"
            >
              <Heart size={19} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-white text-brand text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <div className="text-rose-100 hover:text-white transition-colors duration-200 [&_a]:text-rose-100 [&_a]:hover:text-white">
              <CartIcon />
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-6 bg-white/20 mx-1" />

            {/* Profile */}
            <div className="hidden lg:block relative" ref={dropdownRef}>
              {user ? (
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.name || 'User'}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-white/30 group-hover:ring-white transition-all duration-200"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/30 group-hover:ring-white transition-all duration-200 uppercase">
                      {(profile?.name || 'U').charAt(0)}
                    </div>
                  )}
                  <span className="hidden sm:block text-xs font-semibold text-rose-100 group-hover:text-white transition-colors max-w-[80px] truncate">
                    {profile?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-rose-200 group-hover:text-white transition-all duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#98183f] bg-white transition-all duration-200 hover:bg-rose-50"
                >
                  <User size={15} />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Profile Dropdown */}
              {profileDropdownOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden border border-brand/20 shadow-2xl animate-slide-up z-50"
                  style={{ background: '#4f081c' }}
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-brand/20" style={{ background: '#3b0615' }}>
                    <p className="text-[10px] text-rose-350 font-bold uppercase tracking-widest mb-0.5">Signed in as</p>
                    <p className="text-sm font-bold truncate text-white">{profile?.name || 'User'}</p>
                    <p className="text-[10px] text-rose-200/60 truncate mt-0.5">{user?.email}</p>
                  </div>

                  <div className="py-1.5">
                    {isSuperAdmin ? (
                      <Link
                        to="/superadmin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-100 hover:text-white hover:bg-white/10 transition-all duration-150"
                      >
                        <LayoutDashboard size={14} />
                        Super Admin Panel
                      </Link>
                    ) : isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-100 hover:text-white hover:bg-white/10 transition-all duration-150"
                      >
                        <LayoutDashboard size={14} />
                        Admin Panel
                      </Link>
                    ) : null}
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-100 hover:text-white hover:bg-white/10 transition-all duration-150"
                    >
                      <User size={14} />
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-100 hover:text-white hover:bg-white/10 transition-all duration-150"
                    >
                      <ShoppingBag size={14} />
                      My Orders
                    </Link>
                  </div>

                  <div className="border-t border-brand/20 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold text-rose-300 hover:text-white hover:bg-white/10 transition-all duration-150"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-lg text-rose-100 hover:text-white hover:bg-white/10 transition-all duration-200 ml-1"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Search Bar (drop-down) ── */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ borderTop: searchOpen ? '1px solid rgba(255, 255, 255, 0.15)' : 'none' }}
        >
          <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-200/60" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#4f081c] border border-white/10 focus:border-white/40 rounded-lg text-sm text-white placeholder:text-rose-200/50 focus:outline-none transition-colors duration-200"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-[#98183f] bg-white hover:bg-rose-50 transition-all duration-200 shrink-0"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-2.5 rounded-lg text-rose-100 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <X size={18} />
            </button>
          </form>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden border-t border-white/10 animate-fade-in shadow-inner overflow-y-auto max-h-[calc(100vh-68px)]"
            style={{ background: '#000000' }}
          >
            {/* Mobile search */}
            <div className="px-4 pt-4 pb-2">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-200/50" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#121214] border border-white/10 focus:border-white/30 rounded-lg text-sm text-white placeholder:text-rose-200/40 focus:outline-none transition-colors"
                />
              </form>
            </div>

            {/* Mobile Page Links */}
            <div className="px-4 py-2 space-y-1">
              <NavLinks
                onClick={() => setMobileMenuOpen(false)}
                mobile
              />
              
              {/* Mobile Wishlist Link */}
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-100 hover:text-white hover:bg-white/5 transition-all duration-150"
              >
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-rose-300" />
                  <span>Wishlist</span>
                </div>
                {wishlistCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-white/10 my-2" />


            {/* Mobile Account Details / Authentication */}
            <div className="px-4 pb-6 pt-2">
              {user ? (
                <div className="rounded-xl bg-[#121214] p-3.5 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile?.name || 'User'}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/20 uppercase">
                        {(profile?.name || 'U').charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{profile?.name || 'User'}</p>
                      <p className="text-[11px] text-rose-200/50 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {isSuperAdmin ? (
                      <Link
                        to="/superadmin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs font-bold text-rose-100 hover:text-white transition-all duration-150 text-center"
                      >
                        <LayoutDashboard size={13} />
                        Super Admin
                      </Link>
                    ) : isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs font-bold text-rose-100 hover:text-white transition-all duration-150 text-center"
                      >
                        <LayoutDashboard size={13} />
                        Admin Panel
                      </Link>
                    ) : null}
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs font-bold text-rose-100 hover:text-white transition-all duration-150 text-center ${!isAdmin ? 'col-span-2' : ''}`}
                    >
                      <User size={13} />
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs font-bold text-rose-100 hover:text-white transition-all duration-150 text-center col-span-2"
                    >
                      <ShoppingBag size={13} />
                      My Orders
                    </Link>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300 transition-all duration-150"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-[#98183f] bg-white transition-all duration-200 hover:bg-rose-50"
                >
                  <User size={16} />
                  <span>Sign In to Account</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
