import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Instagram, Quote, Sparkles, ShoppingBag } from 'lucide-react';
import { reviewService } from '../../services/reviewService';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const ReviewsSection = () => {
  const [dbReviews, setDbReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const hardcodedReviews = [
    {
      name: "Ananya Iyer",
      location: "Mumbai, MH",
      rating: 5,
      comment: "Absolutely in love with the Diamond Hoop Earrings! Soshka's curation is second to none. The shine under warm lighting is mesmerizing, and the locking mechanism feels extremely secure.",
      date: "2 days ago",
      isHardcoded: true
    },
    {
      name: "Rohan Mehra",
      location: "New Delhi, DL",
      rating: 5,
      comment: "Bought the Minimalist Gold Band for my wife's birthday. The packaging was beautiful, and she loved the quality of the finish. Definitely coming back for future anniversaries.",
      date: "1 week ago",
      isHardcoded: true
    },
    {
      name: "Priyanka Sen",
      location: "Kolkata, WB",
      rating: 5,
      comment: "Customer support was super helpful when I had to double-check my ring size. Fast shipping and the item looks premium. Soshka is now my go-to for daily wear jewelry.",
      date: "3 weeks ago",
      isHardcoded: true
    }
  ];

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await reviewService.getAllReviews(6);
        setDbReviews(data || []);
      } catch (err) {
        console.error('Error loading reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Today';
    if (diffDays === 2) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  };

  // Combine database reviews with hardcoded ones to ensure the section is populated
  const combinedReviews = [...dbReviews.map(r => ({
    name: r.profile?.name || 'Customer',
    location: 'Verified Buyer',
    rating: r.rating,
    comment: r.comment,
    date: formatDate(r.created_at),
    productName: r.product?.name,
    productId: r.product_id,
    avatarUrl: r.profile?.avatar_url,
    isHardcoded: false
  })), ...hardcodedReviews];

  // Limit to maximum of 6 reviews to keep home page balanced
  const displayReviews = combinedReviews.slice(0, 6);

  return (
    <section id="reviews" className="py-16 sm:py-24 bg-slate-50 dark:bg-black border-t border-slate-200/40 dark:border-white/5 transition-colors duration-300 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── SECTION HEADER ── */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            {...fadeUp()}
            className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-rose-500 mb-3"
          >
            <Sparkles size={12} className="animate-pulse" /> Community Reviews
          </motion.span>
          <motion.h2
            {...fadeUp(0.1)}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Loved by our{' '}
            <span className="bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              community.
            </span>
          </motion.h2>
          <motion.p
            {...fadeUp(0.2)}
            className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed"
          >
            Real feedback from design and jewelry lovers across our store and social media pages.
          </motion.p>
        </div>

        {/* ── SOCIAL SCREENSHOTS PROOFS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start mb-20 max-w-5xl mx-auto">
          {/* WhatsApp Card */}
          <motion.div 
            {...fadeUp(0.1)} 
            className="bg-white dark:bg-[#0c0c0d] border border-slate-200/60 dark:border-[#1c1c1e] p-6 rounded-3xl shadow-sm flex flex-col items-center"
          >
            <div className="flex items-center gap-2 mb-4 text-[#25d366] font-bold text-xs uppercase tracking-wider self-start">
              <MessageCircle size={16} fill="currentColor" className="text-[#25d366]" />
              <span>WhatsApp Chat Proof</span>
            </div>
            <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-[#26262a] shadow-sm hover:scale-[1.02] transition-transform duration-300 bg-slate-50">
              <img 
                src="/img/reviews/whatsapp_review.png" 
                alt="WhatsApp Review Screenshot" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <p className="text-xs text-slate-400 italic text-center mt-4">
              "Packaging 10/10... shine is unbelievable!"
            </p>
          </motion.div>

          {/* Instagram Card */}
          <motion.div 
            {...fadeUp(0.2)} 
            className="bg-white dark:bg-[#0c0c0d] border border-slate-200/60 dark:border-[#1c1c1e] p-6 rounded-3xl shadow-sm flex flex-col items-center"
          >
            <div className="flex items-center gap-2 mb-4 text-[#e1306c] font-bold text-xs uppercase tracking-wider self-start">
              <Instagram size={16} className="text-[#e1306c]" />
              <span>Instagram Feed Post</span>
            </div>
            <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-[#26262a] shadow-sm hover:scale-[1.02] transition-transform duration-300 bg-slate-50">
              <img 
                src="/img/reviews/instagram_review.png" 
                alt="Instagram Review Screenshot" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <p className="text-xs text-slate-400 italic text-center mt-4">
              "Obsessed with this stack from @soshka.in ✨"
            </p>
          </motion.div>
        </div>

        {/* ── WRITTEN TESTIMONIALS (DB + TESTIMONIALS) ── */}
        <div className="space-y-8">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              What Customers Say
            </h3>
            <div className="mt-2 text-rose-500 flex justify-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayReviews.map((review, idx) => (
              <motion.div 
                key={idx}
                {...fadeUp(idx * 0.05)}
                className="bg-white dark:bg-[#0c0c0d] border border-slate-200/60 dark:border-[#1c1c1e] p-6 rounded-2xl relative shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-[#2a2a2d] transition-all duration-300"
              >
                <div className="space-y-3">
                  <Quote className="text-rose-500/10 absolute top-4 right-4 h-10 w-10 pointer-events-none" />
                  
                  <div className="flex gap-0.5 text-rose-500">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                    "{review.comment}"
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {review.avatarUrl ? (
                        <img 
                          src={review.avatarUrl} 
                          alt={review.name} 
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 flex items-center justify-center text-xs font-bold uppercase">
                          {review.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{review.name}</h4>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{review.location}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{review.date}</span>
                  </div>

                  {/* Product Tag if available */}
                  {review.productName && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none">
                      <ShoppingBag size={10} />
                      Reviewed: <span className="text-slate-700 dark:text-slate-300 font-extrabold max-w-[150px] truncate ml-0.5">{review.productName}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default ReviewsSection;
