import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import HeroSection from './HeroSection';
import CategoryBanner from './CategoryBanner';
import FeaturedProducts from './FeaturedProducts';
import { productService } from '../../services/productService';

const HomePage = () => {
  const [offers, setOffers] = useState([]);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const getOffers = async () => {
      try {
        const data = await productService.fetchActiveOffers();
        setOffers(data || []);
      } catch (err) {
        console.error('Error fetching active offers:', err);
      }
    };
    getOffers();
  }, []);

  const promoOffer = offers.find(o => o.is_active && o.message && o.message.trim());
  const bannerOffer = offers.find(o => o.is_active && o.banner_url && o.banner_url.trim());
  const shopLink = bannerOffer && bannerOffer.category_name && bannerOffer.category_name !== 'All'
    ? `/products?category=${encodeURIComponent(bannerOffer.category_name)}`
    : '/products';

  return (
    <div className="flex flex-col min-h-screen">
     

      {/* Hero Banner Component */}
      <HeroSection />

      {/* Category Selection Grid */}
      <CategoryBanner />

      {/* ── Active Campaign Promotion Banner ── */}
      {bannerOffer && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[280px] sm:h-[380px] border border-slate-200/20 dark:border-white/5 group">
            <img
              src={bannerOffer.banner_url}
              alt={bannerOffer.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark glassmorphic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent flex flex-col justify-center p-6 sm:p-16 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ff2a85]/20 text-[#ff2a85] text-[10px] font-black uppercase tracking-widest rounded-full w-fit leading-none">
                <Sparkles size={10} />
                Campaign Offer: {bannerOffer.discount_percent}% OFF
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase max-w-2xl font-serif">
                {bannerOffer.title}
              </h2>
              {bannerOffer.message && (
                <p className="text-slate-300 text-xs sm:text-sm font-semibold max-w-lg">
                  {bannerOffer.message}
                </p>
              )}
              <Link
                to={shopLink}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#98183f] to-[#ff2a85] hover:from-[#7a1232] hover:to-[#e02073] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition duration-300 w-fit"
              >
                Shop the Campaign
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Product Catalog Highlight Grid */}
      <FeaturedProducts />
    </div>
  );
};

export default HomePage;
