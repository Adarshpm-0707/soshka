import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, Truck, RefreshCw } from 'lucide-react';
import HeroSection from './HeroSection';
import CategoryBanner from './CategoryBanner';
import FeaturedProducts from './FeaturedProducts';
import { productService } from '../../services/productService';
import ReviewsSection from '../../components/Home/ReviewsSection';
import SectionTitle from '../../components/Reusable/SectionTitle';
import { useSEO } from '../../hooks/useSEO';

const HomePage = () => {
  const [offers, setOffers] = useState([]);
  const [showBanner, setShowBanner] = useState(true);

  // Invoke SEO hook for the homepage
  useSEO({
    title: "Sõshka | Premium Women's & Kids' Jewellery Online",
    description: "Shop premium anti-tarnish women's & kids' jewellery online. Earrings, rings, necklaces & bracelets with fast delivery across India.",
    canonicalUrl: "https://soshka.in/",
    ogTitle: "Soshka - Premium Women's & Kids' Jewellery",
    ogDescription: "Shop premium anti-tarnish women's & kids' jewellery online. Earrings, rings, necklaces & bracelets with fast delivery across India.",
    ogImage: "https://soshka.in/og-image.jpg",
    ogType: "website",
    twitterCard: "summary_large_image",
    twitterTitle: "Soshka | Premium Women's & Kids' Jewellery",
    twitterDescription: "Shop premium anti-tarnish women's & kids' jewellery online. Earrings, rings, necklaces & bracelets with fast delivery across India.",
    twitterImage: "https://soshka.in/og-image.jpg"
  });

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
      {/* ── Organization & Website Schema Markup ── */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Soshka",
          "url": "https://soshka.in",
          "logo": "https://soshka.in/logo.png",
          "sameAs": [
            "https://www.instagram.com/soshka.in",
            "https://www.facebook.com/soshka.in"
          ]
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Soshka",
          "url": "https://soshka.in",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://soshka.in/products?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </script>

      {/* ── LocalBusiness Schema — E-E-A-T signal ── */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JewelryStore",
          "name": "Soshka",
          "alternateName": "Sõshka",
          "description": "Premium anti-tarnish fashion jewellery for women and kids. Shop earrings, rings, necklaces and bracelets online with secure payments and fast delivery across India.",
          "url": "https://soshka.in",
          "logo": "https://soshka.in/logo.png",
          "image": "https://soshka.in/og-image.jpg",
          "telephone": "+91-94964-65949",
          "email": "soshka.in@gmail.com",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Aleef Global",
            "addressLocality": "Kannur",
            "addressRegion": "Kerala",
            "addressCountry": "IN"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "11.879139",
            "longitude": "75.375944"
          },
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
            "opens": "09:00",
            "closes": "21:00"
          },
          "priceRange": "₹₹",
          "paymentAccepted": "Cash, Credit Card, Debit Card, UPI, Net Banking",
          "currenciesAccepted": "INR",
          "sameAs": [
            "https://www.instagram.com/soshka.in",
            "https://www.facebook.com/soshka.in"
          ]
        })}
      </script>

      {/* Hero Banner Component */}
      <HeroSection />

      {/* Category Selection Grid */}
      <CategoryBanner />

      {/* Product Catalog Highlight Grid */}
      <FeaturedProducts />

      {/* Community Reviews Section */}
      <ReviewsSection />

      {/* ── Active Campaign Promotion Banner ── */}
      {bannerOffer && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl h-[280px] sm:h-[400px] border border-slate-200/20 dark:border-white/5 group">
            <img
              src={bannerOffer.banner_url}
              alt={bannerOffer.title || 'Campaign promotion banner'}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark glassmorphic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-center p-8 sm:p-20 space-y-5">
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#98183f] to-[#ff2a85] hover:from-[#7a1232] hover:to-[#e02073] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition duration-300 w-fit"
              >
                Shop the Campaign
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default HomePage;
