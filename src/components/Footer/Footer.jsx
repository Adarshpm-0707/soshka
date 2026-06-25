import React from "react";
import { Facebook, Twitter, Instagram } from "lucide-react";
import FooterLinks from "./FooterLinks";

const Footer = () => {
  return (
    <footer className="w-full bg-slate-100 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-900 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 pb-12 border-b border-slate-200/80 dark:border-slate-900">
          {/* Logo & Description */}
          <div className="flex flex-col space-y-4">
            <span
              className="text-2xl font-medium tracking-tight leading-none select-none text-slate-900 dark:text-white"
              style={{ fontFamily: "'TT Drugs'", letterSpacing: "-0.5px" }}
            >
              Sõshka
            </span>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Curating premium, handpicked jewelry for a touch of timeless
              elegance. Shop high-quality rings, necklaces, earrings, and
              bracelets directly to your doorstep.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 rounded-xl hover:scale-105 transition shadow-sm"
              >
                <Facebook size={16} />
              </a>

              <a
                href="https://www.instagram.com/soshka.in"
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-600 rounded-xl hover:scale-105 transition shadow-sm"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Nav links columns */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
            <FooterLinks />

            {/* Contact info replacing newsletter form */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-sans">
                Contact Us
              </h4>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                Have questions or need assistance with your order? Reach out to
                us.
              </p>
              <div className="space-y-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <p className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Email:
                  </span>
                  <a
                    href="mailto:soshka.in@gmail.com"
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    soshka.in@gmail.com
                  </a>
                </p>
                <p className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Phone:
                  </span>
                  <a
                    href="tel:+919846545949"
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    +91 98465 45949
                  </a>
                </p>
                <p className="flex items-start space-x-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Address:
                  </span>
                  <a
                    href="https://www.google.com/maps?q=11°52'44.9%22N+75°22'33.4%22E"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    Aleef Global , kannur , kerala , India
                  </a>
                </p>
              </div>
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
