import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Sticky Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
