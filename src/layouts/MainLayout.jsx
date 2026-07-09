import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

const MainLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className={`flex-grow ${isHomePage ? 'pt-0' : 'pt-[82px]'}`}>
        <Outlet />
      </main>

      {/* Sticky Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
