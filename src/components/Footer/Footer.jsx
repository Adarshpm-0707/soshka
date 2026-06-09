import React, { useState } from 'react';
import { Mail, Facebook, Twitter, Instagram, Heart } from 'lucide-react';
import FooterLinks from './FooterLinks';
import { showToast } from '../Reusable/Toast';

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      showToast('Successfully subscribed to newsletter!', 'success');
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="w-full bg-slate-100 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-900 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 pb-12 border-b border-slate-200/80 dark:border-slate-900">
          
          {/* Logo & Description */}
          <div className="flex flex-col space-y-4">
            <span
              className="text-2xl font-medium tracking-tight leading-none select-none text-slate-900 dark:text-white"
              style={{ fontFamily: "'TT Drugs'", letterSpacing: '-0.5px' }}
            >
              Sõshka
            </span>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Curating premium, handpicked jewelry for a touch of timeless elegance. Shop high-quality rings, necklaces, earrings, and bracelets directly to your doorstep.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 rounded-xl hover:scale-105 transition shadow-sm">
                <Facebook size={16} />
              </a>
              <a href="#" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 rounded-xl hover:scale-105 transition shadow-sm">
                <Twitter size={16} />
              </a>
              <a href="#" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 rounded-xl hover:scale-105 transition shadow-sm">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Nav links columns */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
            <FooterLinks />

            {/* Newsletter form */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-sans">
                Stay Updated
              </h4>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                Subscribe to our newsletter to receive sales updates, weekly deals, and fresh arrivals.
              </p>
              <form onSubmit={handleSubscribe} className="flex relative w-full mt-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary-500 transition shadow-sm"
                  required
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition active:scale-95"
                >
                  <Mail size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Copy notices */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 text-xs font-semibold text-slate-450 dark:text-slate-500">
          <p>© {new Date().getFullYear()} Soshka Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
