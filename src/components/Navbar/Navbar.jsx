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
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Scroll listener for shadow depth, hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      if (mobileMenuOpen) return;
      const currentScrollY = window.scrollY;

      // Determine if scrolled past top
      setIsScrolled(currentScrollY > 10);

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
        setSearchOpen(false);
        setProfileDropdownOpen(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

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
      <header
        className={`fixed top-0 left-0 right-0 z-40 w-full transition-transform duration-300 px-4 sm:px-6 lg:px-8 pt-4 pb-2 bg-transparent pointer-events-none ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className={`mx-auto max-w-7xl px-6 h-[58px] rounded-full border flex items-center justify-between shadow-2xl transition-all duration-300 bg-white/10 dark:bg-black/35 backdrop-blur-md border-white/15 pointer-events-auto`}>

          {/* ── Left: Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <span
              className="text-2xl font-black tracking-tight leading-none select-none text-white hover:text-[#ff2a85] transition-all"
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
              className="hidden lg:block p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              aria-expanded={searchOpen}
            >
              <span className="sr-only">Toggle search bar</span>
              <Search size={19} />
            </button>


            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="hidden lg:block relative p-2.5 rounded-lg text-slate-300 hover:text-[#ff2a85] hover:bg-white/10 transition-all duration-200"
              aria-label={wishlistCount > 0 ? `Wishlist — ${wishlistCount} item${wishlistCount > 1 ? 's' : ''}` : 'Wishlist'}
            >
              <span className="sr-only">Wishlist</span>
              <Heart size={19} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#ff2a85] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <div className="text-slate-300 hover:text-white transition-colors duration-200 [&_a]:text-slate-300 [&_a]:hover:text-white [&_a]:hover:bg-white/10 [&_a]:rounded-lg">
              <CartIcon />
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-6 bg-white/15 mx-1" />

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
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-[#ff2a85]/30 group-hover:ring-[#ff2a85] transition-all duration-200"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-[#ff2a85] flex items-center justify-center text-xs font-bold text-white ring-2 ring-[#ff2a85]/30 group-hover:ring-[#ff2a85] transition-all duration-200 uppercase">
                      {(profile?.name || 'U').charAt(0)}
                    </div>
                  )}
                  <span className="hidden sm:block text-xs font-semibold text-slate-200 group-hover:text-white transition-colors max-w-[80px] truncate">
                    {profile?.name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-slate-400 group-hover:text-white transition-all duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider text-white border border-white/30 hover:border-[#ff2a85] hover:bg-white/10 transition-all duration-200"
                >
                  <User size={14} />
                  <span>Login</span>
                </Link>
              )}

              {/* Profile Dropdown */}
              {profileDropdownOpen && user && (
                <div className="absolute right-0 top-full mt-2.5 w-52 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-slide-up z-50 bg-[#0c0c0d]"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-[#121214]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Signed in as</p>
                    <p className="text-sm font-bold truncate text-white">{profile?.name || 'User'}</p>
                    <p className="text-[10px] text-slate-450 truncate mt-0.5">{user?.email}</p>
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

                  <div className="border-t border-slate-100 dark:border-slate-800 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold text-[#ff2a85] hover:bg-white/10 transition-all duration-150"
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
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 ml-1"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Search Bar (drop-down) ── */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out px-4 sm:px-6 lg:px-8 pointer-events-auto ${
            searchOpen ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}
        >
          <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto px-6 py-2.5 rounded-full border bg-black/60 backdrop-blur-md border-white/10 shadow-lg flex gap-3 h-[50px] items-center">
            <label htmlFor="desktop-search-input" className="sr-only">Search products</label>
            <div className="relative flex-1 flex items-center">
              <Search size={16} className="absolute left-3 text-slate-400" />
              <input
                id="desktop-search-input"
                ref={searchInputRef}
                type="text"
                placeholder="Search products, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 bg-transparent text-white placeholder:text-slate-400 focus:outline-none text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-[#ff2a85] hover:bg-[#e01f72] transition-all duration-200 shrink-0"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-1.5 rounded-full text-slate-450 hover:text-white transition-all duration-200"
              aria-label="Close search"
            >
              <X size={16} />
            </button>
          </form>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="lg:hidden mx-auto max-w-7xl mt-2 px-4 sm:px-6 pointer-events-auto animate-slide-up"
          >
            <div className="bg-[#0c0c0d]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
              {/* Mobile search */}
              <div className="pb-1">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <label htmlFor="mobile-search-input" className="sr-only">Search products</label>
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="mobile-search-input"
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 focus:border-white/30 rounded-full text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </form>
              </div>

              {/* Mobile Page Links */}
              <div className="space-y-1.5">
                <NavLinks
                  onClick={() => setMobileMenuOpen(false)}
                  mobile
                />
                
                {/* Mobile Wishlist Link */}
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 transition-all duration-150"
                >
                  <div className="flex items-center gap-2">
                    <Heart size={16} className="text-[#ff2a85]" />
                    <span>Wishlist</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="bg-[#ff2a85] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-2" />

              {/* Mobile Account Details / Authentication */}
              <div className="pt-1">
                {user ? (
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile?.name || 'User'}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-[#ff2a85]/30"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#ff2a85] flex items-center justify-center text-sm font-bold text-white ring-2 ring-[#ff2a85]/20 uppercase">
                          {(profile?.name || 'U').charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{profile?.name || 'User'}</p>
                        <p className="text-[11px] text-slate-450 truncate">{user?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {isSuperAdmin ? (
                        <Link
                          to="/superadmin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-150 text-center"
                        >
                          <LayoutDashboard size={13} />
                          Super Admin
                        </Link>
                      ) : isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-150 text-center"
                        >
                          <LayoutDashboard size={13} />
                          Admin Panel
                        </Link>
                      ) : null}
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-150 text-center ${!isAdmin ? 'col-span-2' : ''}`}
                      >
                        <User size={13} />
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition-all duration-150 text-center col-span-2"
                      >
                        <ShoppingBag size={13} />
                        My Orders
                      </Link>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-[#ff2a85] transition-all duration-150"
                    >
                      <LogOut size={13} />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-black uppercase tracking-wider text-white bg-[#ff2a85] hover:bg-[#e01f72] transition-all duration-200 shadow-lg"
                  >
                    <User size={15} />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
