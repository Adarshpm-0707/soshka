import React from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Instagram, Quote, Sparkles } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const ReviewsPage = () => {
  const textReviews = [
    {
      name: "Ananya Iyer",
      location: "Mumbai, MH",
      rating: 5,
      comment: "Absolutely in love with the Diamond Hoop Earrings! Soshka's curation is second to none. The shine under warm lighting is mesmerizing, and the locking mechanism feels extremely secure.",
      date: "2 days ago"
    },
    {
      name: "Rohan Mehra",
      location: "New Delhi, DL",
      rating: 5,
      comment: "Bought the Minimalist Gold Band for my wife's birthday. The packaging was beautiful, and she loved the quality of the finish. Definitely coming back for future anniversaries.",
      date: "1 week ago"
    },
    {
      name: "Priyanka Sen",
      location: "Kolkata, WB",
      rating: 5,
      comment: "Customer support was super helpful when I had to double-check my ring size. Fast shipping and the item looks premium. Soshka is now my go-to for daily wear jewelry.",
      date: "3 weeks ago"
    }
  ];

  return (
    <div className="bg-white dark:bg-black text-slate-900 dark:text-white min-h-screen transition-colors duration-300">
      
      {/* ── PAGE HEADER ── */}
      <div className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#080809]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 text-center md:text-left">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-rose-500 mb-4"
          >
            <Sparkles size={12} className="animate-pulse" /> Reviews & Testimonials
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight"
          >
            Loved by our{' '}
            <span className="bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              community.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed"
          >
            Real feedback from conversations on Instagram, WhatsApp, and our verified community of design and jewelry lovers.
          </motion.p>
        </div>
      </div>

      {/* ── SOCIAL SCREENSHOTS SECTION ── */}
      <section className="py-14 sm:py-20 border-b border-slate-100 dark:border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <motion.div {...fadeUp()} className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Shared on Social Media
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Screenshots sent by our shoppers on Instagram and WhatsApp chat lines.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
            
            {/* WhatsApp Card */}
            <motion.div 
              {...fadeUp(0.1)} 
              className="bg-slate-50 dark:bg-[#0c0c0d] border border-slate-100 dark:border-[#1c1c1e] p-6 rounded-3xl shadow-sm flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-4 text-[#25d366] font-bold text-xs uppercase tracking-wider self-start">
                <MessageCircle size={16} fill="currentColor" className="text-[#25d366]" />
                <span>WhatsApp chat review</span>
              </div>
              <div className="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-[#26262a] shadow-md hover:scale-[1.02] transition-transform duration-300 bg-white">
                <img 
                  src="/img/reviews/whatsapp_review.png" 
                  alt="WhatsApp Review Screenshot" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-slate-400 italic text-center mt-4">
                "Packaging 10/10... shine is unbelievable!"
              </p>
            </motion.div>

            {/* Instagram Card */}
            <motion.div 
              {...fadeUp(0.2)} 
              className="bg-slate-50 dark:bg-[#0c0c0d] border border-slate-100 dark:border-[#1c1c1e] p-6 rounded-3xl shadow-sm flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-4 text-[#e1306c] font-bold text-xs uppercase tracking-wider self-start">
                <Instagram size={16} className="text-[#e1306c]" />
                <span>Instagram Feed post</span>
              </div>
              <div className="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-[#26262a] shadow-md hover:scale-[1.02] transition-transform duration-300 bg-white">
                <img 
                  src="/img/reviews/instagram_review.png" 
                  alt="Instagram Review Screenshot" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-slate-400 italic text-center mt-4">
                "Obsessed with this stack from @soshka.in ✨"
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── WRITTEN TESTIMONIALS SECTION ── */}
      <section className="py-14 sm:py-20 bg-slate-50/50 dark:bg-neutral-950/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              What Customers Say
            </h2>
            <div className="mt-2 text-rose-500 flex justify-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {textReviews.map((review, idx) => (
              <motion.div 
                key={idx}
                {...fadeUp(idx * 0.1)}
                className="bg-white dark:bg-[#0c0c0d] border border-slate-100 dark:border-[#1c1c1e] p-6 rounded-2xl relative shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <Quote className="text-rose-500/20 absolute top-4 right-4 h-10 w-10 pointer-events-none" />
                  <div className="flex gap-0.5 text-rose-500">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    "{review.comment}"
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{review.name}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{review.location}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{review.date}</span>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
};

export default ReviewsPage;
