import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import FooterLinks from "./FooterLinks";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden w-full bg-slate-50/70 dark:bg-[#030303] border-t border-slate-200/50 dark:border-slate-900/60 transition-colors duration-300">
      {/* ── BACKGROUND GLOW ACCENTS ── */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-rose-500/5 to-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-primary-500/5 to-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 pb-12 border-b border-slate-200/60 dark:border-slate-900/60">
          
          {/* Logo & Description */}
          <div className="flex flex-col space-y-5">
            <span
              className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent select-none cursor-pointer font-serif"
              style={{ letterSpacing: "-1px" }}
            >
              Sõshka
            </span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Curating premium, handpicked fashion jewelry designed with high-quality anti-tarnish technology to bring a touch of timeless elegance directly to your doorstep.
            </p>
            <div className="flex space-x-3.5 pt-2">
              <a
                href="https://www.facebook.com/soshka.in"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-[#1877f2] dark:hover:bg-[#1877f2] hover:border-transparent dark:hover:border-transparent rounded-2xl hover:scale-110 hover:shadow-md transition duration-300"
                aria-label="Soshka on Facebook"
              >
                <span className="sr-only">Facebook</span>
                <Facebook size={18} className="group-hover:animate-pulse" />
              </a>

              <a
                href="https://www.instagram.com/soshka.in"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:border-transparent dark:hover:border-transparent rounded-2xl hover:scale-110 hover:shadow-md transition duration-300"
                aria-label="Instagram"
              >
                <span className="sr-only">Instagram</span>
                <Instagram size={18} className="group-hover:rotate-6" />
              </a>
            </div>
          </div>

          {/* Nav links columns */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
            <FooterLinks />

            {/* Contact Info Column */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-sans">
                Contact Us
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Have questions or need assistance with your order? Our support team is here to help.
              </p>
              
              <div className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-350">
                <a
                  href="mailto:soshka.in@gmail.com"
                  className="flex items-center space-x-2.5 group hover:text-primary-600 dark:hover:text-primary-400 transition"
                >
                  <Mail size={16} className="text-primary-500/80 group-hover:scale-110 transition" />
                  <span className="truncate border-b border-transparent group-hover:border-primary-500/20">
                    soshka.in@gmail.com
                  </span>
                </a>
                
                <a
                  href="https://wa.me/919496465949"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2.5 group hover:text-primary-600 dark:hover:text-primary-400 transition"
                >
                  <Phone size={16} className="text-primary-500/80 group-hover:scale-110 transition" />
                  <span className="border-b border-transparent group-hover:border-primary-500/20">
                    +91 94964 65949
                  </span>
                </a>
                
                <a
                  href="https://www.google.com/maps?q=11°52'44.9%22N+75°22'33.4%22E"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start space-x-2.5 group hover:text-primary-600 dark:hover:text-primary-400 transition"
                >
                  <MapPin size={16} className="text-primary-500/80 group-hover:scale-110 mt-0.5 transition" />
                  <span className="border-b border-transparent group-hover:border-primary-500/20">
                    Aleef Global, Kannur, Kerala, India
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── E-E-A-T Trust Badges ── */}
        <div className="py-8 border-b border-slate-200/60 dark:border-slate-900/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                label: "Secure Checkout",
                sub: "Powered by Razorpay"
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                label: "Easy Returns",
                sub: "48-hour return window"
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                label: "1000+ Customers",
                sub: "Trusted across India"
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
                label: "Fast Delivery",
                sub: "2–5 days pan-India"
              }
            ].map(({ icon, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60"
              >
                <span className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-rose-500/10 to-fuchsia-500/10 text-rose-500 dark:text-rose-400">
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{label}</p>
                  <p className="text-[10px] font-medium text-slate-400 truncate">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visible YMYL Disclaimer */}
        <div className="py-6 border-b border-slate-200/60 dark:border-slate-900/60 text-[11px] font-medium text-slate-450 dark:text-slate-500 leading-relaxed text-center sm:text-left">
          <p>
            <strong>Disclaimer:</strong> All products sold on Sõshka are premium fashion accessories. While we feature advanced anti-tarnish plating technology, our items are not made of solid precious metals (like solid 24k gold or sterling silver) or precious gemstones, unless explicitly stated. Product sizing, weights, and colour configurations may vary slightly. Please follow our care instructions carefully; individual reactions due to skin chemistry or improper care do not qualify for warranty claims.
          </p>
        </div>

        {/* Copy notices & Legal Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-xs font-medium text-slate-405 dark:text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Soshka Store. All rights reserved.</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2">
            <Link
              to="/terms"
              className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition underline-offset-4"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              to="/terms#editorial-policy"
              className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition underline-offset-4"
            >
              Editorial Policy
            </Link>
            <Link
              to="/returns-refunds"
              className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition underline-offset-4"
            >
              Refund Policy
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition underline-offset-4"
            >
              Privacy Policy
            </Link>
            <Link
              to="/shipping-policy"
              className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition underline-offset-4"
            >
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

