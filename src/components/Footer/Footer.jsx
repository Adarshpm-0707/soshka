import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Send,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("name")
          .order("name", { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) setCategories(data);
      } catch (err) {
        console.error("Error fetching categories for footer:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const toggleAccordion = (id) =>
    setOpenAccordion(openAccordion === id ? null : id);

  const shopLinks = [
    { label: "All Products", path: "/products" },
    ...(categories.length > 0
      ? categories.map((cat) => ({
          label: cat.name,
          path: `/products?category=${encodeURIComponent(cat.name)}`,
        }))
      : [
          { label: "Rings", path: "/products?category=Rings" },
          { label: "Necklaces", path: "/products?category=Necklaces" },
          { label: "Earrings", path: "/products?category=Earrings" },
          { label: "Bracelets", path: "/products?category=Bracelets" },
        ]),
  ];

  const companyLinks = [
    { label: "About Us", path: "/about" },
    { label: "Reviews", path: "/reviews" },
    { label: "Contact Us", path: "/contact" },
    { label: "Login", path: "/login" },
    { label: "Register", path: "/register" },
  ];

  const supportLinks = [
    { label: "Returns & Refund", path: "/returns-refunds" },
    { label: "Refund Policy", path: "/refund-policy" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "Shipping Policy", path: "/shipping-policy" },
    { label: "Terms & Conditions", path: "/terms" },
    { label: "Editorial Policy", path: "/terms#editorial-policy" },
    { label: "Shopping Cart", path: "/cart" },
  ];

  const sections = [
    { id: "shop", title: "Shop", links: shopLinks },
    { id: "company", title: "Company", links: companyLinks },
    { id: "support", title: "Support", links: supportLinks },
  ];

  return (
    <footer className="relative w-full bg-[#06060a] text-slate-400 overflow-hidden">
      {/* Subtle background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#ff2a85]/[0.025] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-[#98183f]/[0.02] rounded-full blur-[80px] pointer-events-none" />

      {/* ── TOP HERO BAND ── */}
      <div className="border-b border-white/[0.05]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          {/* Brand */}
          <div className="space-y-4 max-w-sm">
            <span
              className="text-5xl font-black text-white block leading-none"
              style={{ fontFamily: "'TT Drugs', sans-serif", letterSpacing: "-1.5px" }}
            >
              Sõshka
            </span>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Premium anti-tarnish jewellery for women & kids — handpicked,
              hypoallergenic, and built to last.
            </p>
            <div className="flex gap-3 pt-1">
              <a
                href="https://www.facebook.com/soshka.in"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-400 hover:bg-[#1877f2] hover:text-white hover:border-transparent hover:scale-110 transition-all duration-300"
              >
                <Facebook size={15} />
              </a>
              <a
                href="https://www.instagram.com/soshka.in"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-400 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:text-white hover:border-transparent hover:scale-110 transition-all duration-300"
              >
                <Instagram size={15} />
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="w-full lg:w-[380px] bg-white/[0.025] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Send size={13} className="text-[#ff2a85]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                Stay in the Loop
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              New drops, exclusive discounts & styling guides — straight to your inbox.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl">
                <CheckCircle2 size={15} />
                <span className="text-xs font-bold">You're subscribed!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium bg-black/50 border border-white/[0.07] focus:border-[#ff2a85]/60 focus:outline-none text-white placeholder-slate-600 transition-colors duration-200"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#98183f] to-[#ff2a85] hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1 whitespace-nowrap"
                >
                  Join <ArrowRight size={11} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN LINKS GRID ── */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">

          {/* Contact Column */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff2a85]">
              Get in Touch
            </h4>
            <div className="space-y-4">
              <a
                href="mailto:soshka.in@gmail.com"
                className="flex items-start gap-3 group/link hover:text-white transition-colors duration-200"
              >
                <span className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg bg-[#ff2a85]/10 text-[#ff2a85] shrink-0 group-hover/link:scale-110 transition-transform">
                  <Mail size={13} />
                </span>
                <span className="text-xs font-semibold leading-snug">
                  soshka.in@gmail.com
                </span>
              </a>
              <a
                href="https://wa.me/919496465949"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group/link hover:text-[#25d366] transition-colors duration-200"
              >
                <span className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg bg-[#25d366]/10 text-[#25d366] shrink-0 group-hover/link:scale-110 transition-transform">
                  <Phone size={13} />
                </span>
                <span className="text-xs font-semibold leading-snug">
                  +91 94964 65949
                  <br />
                  <span className="text-slate-600 font-medium">WhatsApp only</span>
                </span>
              </a>
              <a
                href="https://www.google.com/maps?q=11°52'44.9%22N+75°22'33.4%22E"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group/link hover:text-white transition-colors duration-200"
              >
                <span className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg bg-[#ff2a85]/10 text-[#ff2a85] shrink-0 group-hover/link:scale-110 transition-transform">
                  <MapPin size={13} />
                </span>
                <span className="text-xs font-semibold leading-relaxed">
                  Aleef Global, Kannur,
                  <br />Kerala, India — 670001
                </span>
              </a>
            </div>
          </div>

          {/* Dynamic link columns */}
          {sections.map((section) => (
            <div key={section.id}>
              {/* Desktop */}
              <div className="hidden sm:block space-y-5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff2a85]">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.path}
                        className="text-xs font-semibold text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                      >
                        <ArrowRight
                          size={9}
                          className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#ff2a85] shrink-0"
                        />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile accordion */}
              <div className="sm:hidden border-b border-white/[0.05] pb-3">
                <button
                  onClick={() => toggleAccordion(section.id)}
                  className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest text-white py-2"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-500 transition-transform duration-300 ${
                      openAccordion === section.id ? "rotate-180 text-[#ff2a85]" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openAccordion === section.id
                      ? "max-h-[300px] opacity-100 mt-2"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <ul className="space-y-2.5 pl-2 pb-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.path}
                          onClick={() => setOpenAccordion(null)}
                          className="text-xs font-semibold text-slate-400 hover:text-[#ff2a85] transition-colors duration-200 block"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DISCLAIMER ── */}
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-5">
          <p className="text-[10px] text-slate-600 leading-relaxed text-center">
            <strong className="text-slate-500 uppercase tracking-widest font-bold text-[9px]">
              Disclaimer:{" "}
            </strong>
            All Sõshka products are premium fashion accessories. They are not solid
            precious metals or certified gemstones unless explicitly stated. Tarnish
            from chemical exposure does not qualify for warranty claims.
          </p>
        </div>
      </div>

      {/* ── COPYRIGHT BAR ── */}
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold text-slate-600">
          <p>© {new Date().getFullYear()} Sõshka. All rights reserved.</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-x-5 gap-y-1.5">
            {[
              { label: "Terms", path: "/terms" },
              { label: "Privacy", path: "/privacy-policy" },
              { label: "Shipping", path: "/shipping-policy" },
              { label: "Refunds", path: "/refund-policy" },
            ].map((l) => (
              <Link
                key={l.label}
                to={l.path}
                className="hover:text-[#ff2a85] transition-colors duration-200"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
