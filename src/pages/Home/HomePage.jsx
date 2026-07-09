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

      {/* ── Active Campaign Promotion Banner ── */}
      {bannerOffer && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[280px] sm:h-[380px] border border-slate-200/20 dark:border-white/5 group">
            <img
              src={bannerOffer.banner_url}
              alt={bannerOffer.title || 'Campaign promotion banner'}
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

      {/* ── FAQ Section ── */}
      <section className="py-16 bg-white dark:bg-[#030303] border-t border-slate-200/40 dark:border-white/5 transition-colors duration-300">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Frequently Asked Questions"
            subtitle="Got questions? We've got answers. Find help on orders, shipping, returns, and security."
            align="center"
          />

          <div className="mt-12 space-y-4">
            {[
              {
                q: "How long is delivery?",
                a: "We process and ship orders within 24 to 48 hours. Once shipped, delivery usually takes 2 to 4 business days for metro cities and 3 to 5 business days for the rest of India. All packages are shipped via reliable, premium courier services with live tracking."
              },
              {
                q: "Do you offer COD?",
                a: "Yes! We offer Cash on Delivery (COD) services across almost all major pin codes in India. You can select Cash on Delivery as your payment option during checkout with no extra processing fees."
              },
              {
                q: "Can I return products?",
                a: "Absolutely. We accept returns or replacement requests within 48 hours of delivery if you receive a damaged, defective, or incorrect item. To claim a replacement or return, please share your order number and a complete unboxing video showing the sealed parcel being opened."
              },
              {
                q: "Are payments secure?",
                a: "Yes, payments on Soshka.in are 100% secure. We partner with Razorpay, India's leading payment gateway provider, using industry-grade SSL encryption to ensure your card details, UPI transactions, and personal information are fully protected."
              },
              {
                q: "How do refunds work?",
                a: "Once we receive and verify your returned product, we will initiate your refund. Approved refunds are credited directly to your original payment method or bank account within 5 to 7 business days."
              }
            ].map((faq, idx) => (
              <details key={idx} className="group border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-905/40 p-6 [&_summary::-webkit-details-marker]:hidden transition-all duration-300">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">
                    {faq.q}
                  </h3>
                  <span className="ml-1.5 shrink-0 rounded-full p-1.5 text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-open:rotate-180 transition duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* ── FAQ Schema Markup ── */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How long is delivery?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We process and ship orders within 24 to 48 hours. Once shipped, delivery usually takes 2 to 4 business days for metro cities and 3 to 5 business days for the rest of India. All packages are shipped via reliable, premium courier services with live tracking."
                }
              },
              {
                "@type": "Question",
                "name": "Do you offer COD?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! We offer Cash on Delivery (COD) services across almost all major pin codes in India. You can select Cash on Delivery as your payment option during checkout with no extra processing fees."
                }
              },
              {
                "@type": "Question",
                "name": "Can I return products?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely. We accept returns or replacement requests within 48 hours of delivery if you receive a damaged, defective, or incorrect item. To claim a replacement or return, please share your order number and a complete unboxing video showing the sealed parcel being opened."
                }
              },
              {
                "@type": "Question",
                "name": "Are payments secure?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, payments on Soshka.in are 100% secure. We partner with Razorpay, India's leading payment gateway provider, using industry-grade SSL encryption to ensure your card details, UPI transactions, and personal information are fully protected."
                }
              },
              {
                "@type": "Question",
                "name": "How do refunds work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Once we receive and verify your returned product, we will initiate your refund. Approved refunds are credited directly to your original payment method or bank account within 5 to 7 business days."
                }
              }
            ]
          })}
        </script>
      </section>

      {/* Community Reviews Section */}
      <ReviewsSection />

      {/* ── SEO Editorial Copy Section ── */}
      <section className="py-20 bg-slate-50 dark:bg-black border-t border-slate-200/40 dark:border-white/5 transition-colors duration-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12 text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-semibold text-sm">

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">
              Why Shop From Soshka?
            </h2>
            <p>
              Soshka is your go-to destination for premium, anti-tarnish fashion jewellery online in India. We specialize in curating an exclusive range of earrings, necklaces, bracelets, and rings tailored for women and kids who appreciate style without compromising on durability. All of our curated pieces are treated with state-of-the-art anti-tarnish technology that prevents oxidation and discoloration, keeping your precious accessories looking brand new and radiant for years to come.
            </p>
            <p>
              We understand that choosing fashion jewellery online can be challenging with so many generic options of questionable quality. At Soshka, we resolve this by selectively sourcing only premium, hypoallergenic, nickel-free, and lead-free alloys. This makes our entire catalog completely safe for sensitive skin types, allowing you to wear your favourite rings, studs, and chains daily with complete comfort. Whether you are dressing up for a festive Indian wedding, accessorizing for a corporate meeting, or selecting a subtle daily wear accessory, Soshka offers the perfect piece.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-500 dark:text-slate-400">
              <li>Anti-tarnish coating that lasts for years</li>
              <li>Hypoallergenic materials — safe for sensitive skin</li>
              <li>Secure payments via Razorpay (UPI, cards, wallets, COD)</li>
              <li>Fast shipping across all of India in 2 to 5 days</li>
              <li>Easy 48-hour returns for damaged or wrong items</li>
              <li>Responsive customer support on WhatsApp and email</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">
              Premium Fashion Accessories
            </h2>
            <p>
              At Soshka, we believe your accessories say a lot about you.
              Our range of fashion accessories is designed to match any outfit.
              We have jewellery for everyday wear and for special events.
              You will find earrings, necklaces, bracelets, rings, and hair clips.
            </p>
            <p>
              We also offer beautiful gifts. Looking for a birthday or anniversary gift?
              Soshka gift boxes are packed with care. They make a great impression.
              Each box arrives in premium packaging that feels special when you open it.
            </p>
            <p>
              Our hair accessories include statement clips, headbands, and decorative pins.
              They are made from strong metals and smooth acrylics. They will not snag your hair.
              Pick a style that matches your look and feel great all day.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">
              Best Selling Earrings
            </h2>
            <p>
              Earrings are at the heart of every jewellery collection.
              Soshka has a wide range of anti-tarnish earrings for all styles.
              We have gold hoops, studs, drops, and dangling designs.
              Our best sellers are rose gold hoops and ruby studs.
              Customers love them for their shine and light weight.
            </p>
            <p>
              We also sell safe jewellery for kids. Kids have sensitive skin.
              All our kids' pieces are nickel-free and lead-free.
              They have safety clasps so they do not fall off.
              Our kids' earrings and bracelets are colourful and fun.
              They are perfect gifts for birthdays and festivals.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">
              New Arrivals
            </h2>
            <p>
              We add new designs all the time. Our necklace collection has layered chains,
              simple pendants, and bold statement pieces.
              They are made from high-polish gold and silver-plated alloys.
              They keep their shine and do not scratch easily.
            </p>
            <p>
              For your hands, try our rings and bracelets.
              We have thin stacking rings and bold statement rings.
              Our bracelets come in classic chains and stone-set cuffs.
              Mix and match them to make your own style.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">
              Indian Fashion Jewellery
            </h2>
            <p>
              India has a rich history of great jewellery. Soshka celebrates this.
              We mix classic Indian designs with modern anti-tarnish technology.
              Our Indian fashion line has drop earrings and layered chains.
              They look great with Indian ethnic clothes as well as western outfits.
            </p>
            <p>
              We replaced heavy, allergy-prone metals with certified safe alloys.
              You can wear them for hours at weddings and long events with no discomfort.
              Soshka ships across India. Our payments are secure via Razorpay.
              Our support team is always ready to help you on WhatsApp at +91 94964 65949
              or by email at soshka.in@gmail.com.
              Explore our full collection and find a piece you will love.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">
              How We Deliver Across India
            </h2>
            <p>
              We process your order within 24 to 48 hours of payment.
              After packing, we ship via trusted courier partners.
              Metro cities get their orders in 2 to 4 days.
              Other cities and towns get them in 3 to 5 days.
              You get a tracking link so you can follow your parcel at every step.
            </p>
            <p>
              We also offer Cash on Delivery (COD) at no extra cost.
              Just select COD at checkout. No card or app needed.
              Pay the delivery person when your order arrives at your door.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default HomePage;
