import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import SectionTitle from '../../components/Reusable/SectionTitle';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const AboutPage = () => {
  return (
    <div className="bg-white dark:bg-black text-slate-900 dark:text-white min-h-screen">

      {/* ── PAGE HEADER ── */}
      <div className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#080809]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-rose-500 mb-4"
          >
            About Soshka
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight"
          >
            A store built on{' '}
            <span className="bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              true curation.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed"
          >
            Founded by designers and product lovers. Every item in our catalog has been physically reviewed and chosen by our team.
          </motion.p>
        </div>
      </div>

     

      {/* ── OUR STORY ── */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">

          {/* Mobile: stacked. Desktop: sidebar + content */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10">

            {/* Label */}
            <motion.div {...fadeUp()} className="lg:col-span-3">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-rose-500">Our Story</span>
              <div className="mt-3 w-8 h-0.5 bg-rose-500" />
            </motion.div>

            {/* Content */}
            <div className="lg:col-span-9 space-y-5">
              <motion.h2
                {...fadeUp(0.05)}
                className="text-2xl sm:text-3xl font-extrabold leading-tight"
              >
                We were tired of settling for "good enough."
              </motion.h2>

              <motion.p
                {...fadeUp(0.1)}
                className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed"
              >
                Soshka was founded in 2026 by a small team of designers and product enthusiasts who believed every object in your life should be intentional. We skip the generic marketplace model — every product is hand-reviewed, tested, and chosen by people who genuinely care about craft and quality.
              </motion.p>

              <motion.ul
                {...fadeUp(0.15)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1"
              >
                {[
                  'Hand-reviewed by our design team',
                  'Sourced from verified artisan makers',
                  'Quality-tested before every listing',
                  'Full return & warranty included',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-medium"
                  >
                    <CheckCircle2 size={15} className="text-rose-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </motion.ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION CLOSE ── */}
      <section className="py-14 sm:py-20 border-t border-slate-100 dark:border-white/5 mt-10 sm:mt-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...fadeUp()}>
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-rose-500 mb-5">
              Our Mission
            </span>
            <blockquote className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
              "To make the world's finest objects accessible to people who care about quality as much as we do."
            </blockquote>
            <div className="mt-7 flex items-center justify-center gap-3">
            
            
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ Section (Redesigned & Premium) ── */}
      <section className="py-24 bg-slate-50 dark:bg-[#020202] border-t border-slate-100 dark:border-white/5 transition-colors duration-300">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about Sõshka: ordering, payment, shipping, and returns."
            align="center"
          />

          <div className="mt-16 space-y-6">
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
                className="group border border-slate-200/60 dark:border-white/5 rounded-3xl bg-white dark:bg-[#0b0b0c] p-6 sm:p-8 [&_summary::-webkit-details-marker]:hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(255,42,133,0.06)] hover:border-[#ff2a85]/20 dark:hover:border-[#ff2a85]/30"
              >
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">
                    {faq.q}
                  </h3>
                  <span className="ml-4 shrink-0 rounded-full p-2 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#121214] border border-slate-200/50 dark:border-white/10 group-open:rotate-180 transition duration-300 shadow-sm group-hover:text-[#ff2a85] group-hover:border-[#ff2a85]/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed font-sans border-t border-slate-100 dark:border-white/5 pt-4">
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
      <section className="py-24 bg-slate-50 dark:bg-black border-t border-slate-200/40 dark:border-white/5 transition-colors duration-300">
  <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12 text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-semibold text-sm">
    <div className="space-y-4">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">Why Shop From Soshka?</h2>
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
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">Premium Fashion Accessories</h2>
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
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">Best Selling Earrings</h2>
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
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">New Arrivals</h2>
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
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">Indian Fashion Jewellery</h2>
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
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif">How We Deliver Across India</h2>
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
</section>

    </div>
  );
};

export default AboutPage;
