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
                href="#"
                className="group p-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-[#1877f2] dark:hover:bg-[#1877f2] hover:border-transparent dark:hover:border-transparent rounded-2xl hover:scale-110 hover:shadow-md transition duration-300"
                aria-label="Facebook"
              >
                <Facebook size={18} className="group-hover:animate-pulse" />
              </a>

              <a
                href="https://www.instagram.com/soshka.in"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:border-transparent dark:hover:border-transparent rounded-2xl hover:scale-110 hover:shadow-md transition duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} className="group-hover:rotate-6" />
              </a>
            </div>
          </div>

          {/* Nav links columns */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
            <FooterLinks />

            {/* Contact Info Column */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-sans">
                Contact Us
              </h4>
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

        {/* Copy notices & Legal Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-xs font-medium text-slate-405 dark:text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Soshka Store. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link
              to="/terms"
              className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition underline-offset-4"
            >
              Terms & Conditions
            </Link>
            <Link
              to="/returns-refunds"
              className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition underline-offset-4"
            >
              Returns & Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
