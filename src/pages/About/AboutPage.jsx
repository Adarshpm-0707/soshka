import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Eye,
  HeartHandshake,
  Gem,
  ArrowRight,
  Truck,
  ShieldAlert,
  Headphones,
  CreditCard,
  Layers,
  Feather,
  Smile,
  Compass,
  Award,
  ChevronDown,
  ShoppingBag,
  Clock,
  Sparkle
} from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const AboutPage = () => {
  // Enhanced SEO configuration
  useSEO({
    title: "About Sõshka | Premium Stainless Steel Anti Tarnish Jewellery Online",
    description: "Discover Sõshka — curated Stainless Steel Anti Tarnish Jewellery for women and kids. Lightweight, skin-friendly, durable pieces crafted for everyday moments across India.",
    canonicalUrl: "https://soshka.in/about",
    ogTitle: "About Sõshka | Anti-Tarnish Jewellery Made For Everyday Moments",
    ogDescription: "Thoughtfully selected Stainless Steel Anti Tarnish Jewellery for women and kids. Explore our story, curation philosophy, and quality commitment.",
    ogImage: "https://soshka.in/og-image.jpg",
    ogType: "website",
    twitterCard: "summary_large_image",
    twitterTitle: "About Sõshka | Premium Anti-Tarnish Jewellery",
    twitterDescription: "Discover Sõshka — curated Stainless Steel Anti Tarnish Jewellery for women and kids designed to keep its shine.",
    twitterImage: "https://soshka.in/og-image.jpg",
  });

  const categories = [
    {
      title: "Earrings",
      description: "From everyday studs and classic hoops to elegant drops and statement styles.",
      path: "/products?category=Earrings",
      badge: "Everyday & Statement"
    },
    {
      title: "Necklaces",
      description: "Delicate pendants, layered chains, and statement necklaces that instantly add character to your look.",
      path: "/products?category=Necklaces",
      badge: "Layered & Pendants"
    },
    {
      title: "Bangles & Bracelets",
      description: "From simple everyday pieces to eye-catching designs — made to be styled your way.",
      path: "/products?category=Bracelets",
      badge: "Cuffs & Chains"
    },
    {
      title: "Rings",
      description: "Minimal everyday rings, stacking styles, and statement designs for a look that feels uniquely yours.",
      path: "/products?category=Rings",
      badge: "Stackable & Minimal"
    },
    {
      title: "Jewellery for Kids",
      description: "Fun, comfortable designs made for little personalities, with special attention to comfort and material selection.",
      path: "/products?category=Kids",
      badge: "Skin-Friendly & Fun"
    }
  ];

  const whyChoosePoints = [
    {
      title: "Beyond the photograph",
      description: "We look beyond how a piece appears in a photograph. Before adding jewellery to our collection, we consider its design, finish, comfort, styling possibilities, and how easily it fits into everyday life.",
      icon: Eye
    },
    {
      title: "Made to keep its shine",
      description: "Our collection includes carefully selected Stainless Steel Anti Tarnish Jewellery designed for regular wear. With proper care, these pieces are made to maintain their appearance and shine for longer.",
      icon: Sparkles
    },
    {
      title: "Comfort-first choices",
      description: "Jewellery should never feel like something you can't wait to take off. We focus on lightweight, comfortable, and skin-friendly options that are easy to enjoy throughout the day.",
      icon: Feather
    },
    {
      title: "A collection worth choosing",
      description: "Not the biggest collection — the right one. Every addition to Sõshka is chosen with attention to design, quality, comfort, and everyday wearability.",
      icon: Award
    }
  ];

  const valueProps = [
    { text: "Anti-tarnish jewellery for everyday styling", icon: Sparkles },
    { text: "Lightweight and comfortable designs", icon: Feather },
    { text: "Skin-friendly options across selected collections", icon: HeartHandshake },
    { text: "Nickel-free and lead-free options across selected pieces", icon: ShieldCheck },
    { text: "Jewellery for women and kids", icon: Smile },
    { text: "Secure payment options", icon: CreditCard },
    { text: "Shipping across India", icon: Truck },
    { text: "Customer support through WhatsApp and email", icon: Headphones },
  ];

  const qualityPillars = [
    {
      num: "01",
      title: "Design",
      description: "Styles that feel modern, wearable, and easy to pair with different outfits."
    },
    {
      num: "02",
      title: "Finish",
      description: "Clean detailing and a finish that complements the design beautifully."
    },
    {
      num: "03",
      title: "Comfort",
      description: "Beautiful jewellery should still feel comfortable after hours of wearing it."
    },
    {
      num: "04",
      title: "Everyday Wearability",
      description: "Pieces designed to become part of your wardrobe rather than something you wear only once."
    }
  ];

  return (
    <div className="bg-white dark:bg-[#06060a] text-slate-900 dark:text-white min-h-screen selection:bg-[#ff2a85] selection:text-white overflow-hidden">

      {/* ── JSON-LD Structured Data for SEO ── */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Sõshka",
          "description": "At Sõshka, we believe jewellery should feel as good as it looks. Our collection of Stainless Steel Anti Tarnish Jewellery is thoughtfully selected for women and kids.",
          "publisher": {
            "@type": "Organization",
            "name": "Sõshka",
            "url": "https://soshka.in",
            "logo": "https://soshka.in/logo.png"
          }
        })}
      </script>

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

      {/* ── 1. HERO SECTION: ABOUT SÕSHKA ── */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-100 dark:border-white/5 bg-gradient-to-b from-rose-50/50 via-white to-transparent dark:from-[#0d0710] dark:via-[#06060a] dark:to-[#06060a]">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-r from-[#98183f]/10 to-[#ff2a85]/15 dark:from-[#98183f]/20 dark:to-[#ff2a85]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-200/80 dark:border-[#ff2a85]/30 bg-rose-50/80 dark:bg-[#ff2a85]/10 text-rose-600 dark:text-[#ff2a85] text-xs font-bold tracking-[0.25em] uppercase mb-6 backdrop-blur-sm"
          >
            <Sparkles size={12} className="shrink-0" />
            <span>About Sõshka</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-serif leading-[1.15] max-w-4xl mx-auto"
          >
            Jewellery chosen with care,{' '}
            <span className="bg-gradient-to-r from-[#98183f] via-[#d61e6c] to-[#ff2a85] bg-clip-text text-transparent italic">
              made for everyday moments.
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 space-y-4 max-w-3xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans"
          >
            <p>
              At <strong className="font-semibold text-slate-900 dark:text-white">Sõshka</strong>, we believe jewellery should feel as good as it looks. Our collection of <span className="text-[#98183f] dark:text-[#ff2a85] font-semibold">Stainless Steel Anti Tarnish Jewellery</span> is thoughtfully selected for women and kids who love pieces that are stylish, comfortable, versatile, and easy to wear every day.
            </p>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              From minimal everyday designs to pieces made for special moments, we focus on jewellery that fits effortlessly into your lifestyle. Lightweight, durable, and designed to complement every look with ease.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/products"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#98183f] to-[#ff2a85] hover:from-[#7a1232] hover:to-[#e02073] text-white font-bold text-sm rounded-full shadow-lg shadow-rose-500/25 transition duration-300 group"
            >
              <ShoppingBag size={16} />
              <span>Explore Collection</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-slate-200 dark:border-white/10 hover:border-rose-400 dark:hover:border-rose-500/50 bg-white/70 dark:bg-white/5 backdrop-blur text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-full transition duration-300"
            >
              Get in Touch
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 2. OUR STORY SECTION ── */}
      <section className="py-16 sm:py-24 relative border-b border-slate-100 dark:border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Left Header */}
            <motion.div {...fadeUp()} className="lg:col-span-4 lg:sticky lg:top-28">
              <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#ff2a85]">Our Story</span>
              <div className="mt-2.5 w-10 h-0.5 bg-gradient-to-r from-[#ff2a85] to-[#98183f] rounded-full" />
              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif leading-tight">
                It started with a simple idea — jewellery should be easy to love and easy to wear.
              </h2>
            </motion.div>

            {/* Right Story Content */}
            <div className="lg:col-span-8 space-y-6">
              <motion.div {...fadeUp(0.1)} className="space-y-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                <p>
                  With so many jewellery options available online, finding pieces that truly combine style, comfort, and quality can feel overwhelming. Sõshka was created to make that choice simpler.
                </p>
                <p>
                  We carefully curate <strong className="font-semibold text-slate-900 dark:text-white">stainless steel anti tarnish jewellery</strong> that suits real lifestyles — pieces you can wear to work, style with your favourite outfit, take to a celebration, or simply enjoy every day.
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  Our focus isn't on having the biggest collection. It's about bringing together designs that feel worth choosing.
                </p>
              </motion.div>

              {/* Story Highlights Grid */}
              <motion.div {...fadeUp(0.15)} className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    "Carefully selected designs",
                    "Quality-focused materials",
                    "Anti-tarnish jewellery for everyday wear",
                    "Comfortable styles for women and kids",
                    "Secure shopping experience",
                    "Easy support whenever you need it",
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 hover:border-rose-300/60 dark:hover:border-[#ff2a85]/30 transition-colors duration-200"
                    >
                      <div className="w-7 h-7 rounded-full bg-rose-500/10 dark:bg-[#ff2a85]/20 flex items-center justify-center shrink-0 text-[#ff2a85]">
                        <CheckCircle2 size={15} />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. WHAT MAKES SÕSHKA DIFFERENT? ── */}
      <section className="py-16 sm:py-24 bg-slate-50/70 dark:bg-[#030305] border-b border-slate-100 dark:border-white/5 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-xs font-bold tracking-[0.25em] uppercase text-[#ff2a85] mb-2.5">
              What Makes Sõshka Different?
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight">
              More than just jewellery.
            </h2>
            <div className="mt-3.5 w-12 h-0.5 bg-gradient-to-r from-[#98183f] to-[#ff2a85] mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {whyChoosePoints.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={idx}
                  {...fadeUp(0.08 * idx)}
                  className="group relative p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#0b0b0f] border border-slate-200/70 dark:border-white/5 hover:border-rose-300 dark:hover:border-[#ff2a85]/40 transition-all duration-300 shadow-sm hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(255,42,133,0.08)] flex flex-col"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 dark:from-white/5 dark:to-white/[0.02] border border-rose-200/50 dark:border-white/10 flex items-center justify-center text-[#ff2a85] mb-5 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent size={22} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 font-serif">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 4. JEWELLERY FOR EVERY STYLE ── */}
      <section className="py-16 sm:py-24 border-b border-slate-100 dark:border-white/5 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-xs font-bold tracking-[0.25em] uppercase text-[#ff2a85] mb-2.5">
              Jewellery For Every Style
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight">
              Minimal or statement — there's something here for you.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              From everyday essentials to eye-catching designs, our collection is made for different moods, moments, and personal styles.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, idx) => (
              <motion.div
                key={idx}
                {...fadeUp(0.06 * idx)}
                className={`group relative p-6 sm:p-7 rounded-3xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 hover:border-rose-300 dark:hover:border-[#ff2a85]/40 transition-all duration-300 flex flex-col justify-between ${
                  idx === 4 ? 'sm:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff2a85] bg-rose-500/10 px-2.5 py-1 rounded-full">
                      {cat.badge}
                    </span>
                    <Gem size={14} className="text-slate-400 dark:text-slate-600 group-hover:text-[#ff2a85] transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif mb-2 group-hover:text-[#ff2a85] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                  <Link
                    to={cat.path}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#ff2a85] transition-colors"
                  >
                    <span>View {cat.title}</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 5. WHY SHOP ANTI-TARNISH JEWELLERY FROM SÕSHKA? ── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-[#06060a] dark:to-[#09050c] border-b border-slate-100 dark:border-white/5 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Narrative */}
            <motion.div {...fadeUp()} className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold tracking-[0.25em] uppercase text-[#ff2a85]">
                The Anti-Tarnish Advantage
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif leading-tight">
                Why Shop Anti-Tarnish Jewellery From Sõshka?
              </h2>
              <div className="w-10 h-0.5 bg-[#ff2a85] rounded-full" />
              
              <div className="space-y-3.5 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Jewellery is meant to be worn, not kept hidden away.
                </p>
                <p>
                  Our <strong className="text-slate-900 dark:text-white font-semibold">Stainless Steel Anti Tarnish Jewellery</strong> collection is selected for people who want stylish pieces they can reach for again and again.
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  With proper care, our anti-tarnish jewellery is designed to retain its shine and appearance for longer.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm rounded-full transition duration-300 shadow-md"
                >
                  <span>Shop Anti-Tarnish Pieces</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Right Value Grid */}
            <motion.div {...fadeUp(0.15)} className="lg:col-span-7 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {valueProps.map((prop, idx) => {
                  const Icon = prop.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-[#0e0e12] border border-slate-200/70 dark:border-white/5 hover:border-rose-300 dark:hover:border-[#ff2a85]/30 transition-all duration-200 shadow-sm flex items-start gap-3.5 group"
                    >
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-white/[0.04] text-[#ff2a85] shrink-0 group-hover:scale-105 transition-transform">
                        <Icon size={16} />
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                        {prop.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ── 6. PREMIUM STAINLESS STEEL ANTI TARNISH JEWELLERY ONLINE ── */}
      <section className="py-16 sm:py-24 border-b border-slate-100 dark:border-white/5 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <motion.div {...fadeUp()}>
            <span className="inline-block text-xs font-bold tracking-[0.25em] uppercase text-[#ff2a85] mb-3">
              Premium Stainless Steel Anti Tarnish Jewellery Online
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif leading-tight">
              Looking for stylish jewellery online in India?
            </h2>
            <div className="mt-4 w-12 h-0.5 bg-[#ff2a85] mx-auto rounded-full" />
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="mt-8 space-y-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
            <p>
              Sõshka brings together modern <strong className="text-slate-900 dark:text-white font-semibold">Stainless Steel Anti Tarnish Jewellery</strong> that is easy to style, comfortable to wear, and thoughtfully selected for quality.
            </p>
            <p>
              Whether you're looking for earrings for everyday wear, a necklace for a special occasion, a bangle to complete your outfit, or a thoughtful gift, our collection is designed to give you more choices without making your search complicated.
            </p>
            <p className="text-base sm:text-lg font-serif italic text-[#98183f] dark:text-[#ff2a85] pt-2">
              "Because finding jewellery you love should feel simple."
            </p>
          </motion.div>

        </div>
      </section>

      {/* ── 7. OUR APPROACH TO QUALITY ── */}
      <section className="py-16 sm:py-24 bg-slate-50/70 dark:bg-[#030305] border-b border-slate-100 dark:border-white/5 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-xs font-bold tracking-[0.25em] uppercase text-[#ff2a85] mb-2.5">
              Our Approach To Quality
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight">
              Every piece, considered.
            </h2>
            <div className="mt-3.5 w-12 h-0.5 bg-gradient-to-r from-[#98183f] to-[#ff2a85] mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {qualityPillars.map((pillar, idx) => (
              <motion.div
                key={idx}
                {...fadeUp(0.08 * idx)}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0b0b0f] border border-slate-200/70 dark:border-white/5 hover:border-rose-300 dark:hover:border-[#ff2a85]/40 transition-all duration-300 shadow-sm flex flex-col justify-between group"
              >
                <div>
                  <span className="text-2xl font-black text-rose-200 dark:text-white/10 group-hover:text-[#ff2a85]/40 transition-colors font-serif">
                    {pillar.num}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif mt-2 mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                    {pillar.description}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="w-5 h-0.5 bg-rose-400/40 dark:bg-rose-500/30 rounded-full group-hover:w-10 transition-all duration-300" />
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 8. OUR PROMISE & CLOSING CTA ── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        {/* Background glow banner */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/[0.03] to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          
          <motion.div {...fadeUp()} className="space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-200 dark:border-[#ff2a85]/30 bg-rose-50 dark:bg-[#ff2a85]/10 text-rose-600 dark:text-[#ff2a85] text-xs font-bold tracking-[0.25em] uppercase">
              <Award size={13} />
              <span>Our Promise</span>
            </span>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white font-serif leading-tight">
              Jewellery you'll want to wear{' '}
              <span className="bg-gradient-to-r from-[#98183f] to-[#ff2a85] bg-clip-text text-transparent italic">
                again and again.
              </span>
            </h2>

            <div className="space-y-4 max-w-2xl mx-auto text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              <p>
                We want every Sõshka order to feel like a good choice — from the moment you discover a piece to the moment you wear it.
              </p>
              <p>
                We are continuously adding new designs while keeping our focus on what matters most: thoughtful selection, beautiful design, quality, comfort, and a better shopping experience.
              </p>
            </div>

            {/* Blockquote Card */}
            <div className="my-8 p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 max-w-2xl mx-auto shadow-inner">
              <blockquote className="text-base sm:text-lg lg:text-xl font-bold font-serif text-slate-800 dark:text-slate-100 italic leading-relaxed">
                "At Sõshka, every piece is chosen with everyday moments in mind — because the best jewellery isn't just something you own. It's something you keep reaching for."
              </blockquote>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[#98183f] to-[#ff2a85] hover:from-[#7a1232] hover:to-[#e02073] text-white font-extrabold text-sm rounded-full shadow-xl shadow-rose-500/20 transition duration-300 group"
              >
                <span>Shop All Jewellery</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-4 border border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-full transition duration-300"
              >
                <span>Need Support? Contact Us</span>
              </Link>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── 9. FREQUENTLY ASKED QUESTIONS SECTION ── */}
      <section className="py-20 sm:py-24 bg-slate-50/80 dark:bg-[#020202] border-t border-slate-100 dark:border-white/5 transition-colors duration-300">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-xs font-bold tracking-[0.25em] uppercase text-[#ff2a85] mb-2.5">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Everything you need to know about Sõshka: ordering, payment, shipping, and returns.
            </p>
          </motion.div>

          <div className="space-y-4">
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
                q: "Are payments secure?",
                a: "Yes, payments on Soshka.in are 100% secure. We partner with Razorpay, India's leading payment gateway provider, using industry-grade SSL encryption to ensure your card details, UPI transactions, and personal information are fully protected."
              },
              {
                q: "How do refunds work?",
                a: "Once we receive and verify your returned product, we will initiate your refund. Approved refunds are credited directly to your original payment method or bank account within 5 to 7 business days."
              }
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group border border-slate-200/70 dark:border-white/5 rounded-2xl bg-white dark:bg-[#0b0b0c] p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 hover:shadow-md hover:border-[#ff2a85]/30"
              >
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none select-none">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">
                    {faq.q}
                  </h3>
                  <span className="ml-4 shrink-0 rounded-full p-1.5 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#121214] border border-slate-200/50 dark:border-white/10 group-open:rotate-180 transition-transform duration-300 shadow-sm group-hover:text-[#ff2a85]">
                    <ChevronDown size={16} />
                  </span>
                </summary>
                <p className="mt-3.5 text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-400 leading-relaxed font-sans border-t border-slate-100 dark:border-white/5 pt-3.5">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
