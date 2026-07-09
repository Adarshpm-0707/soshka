import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Instagram, Quote, Sparkles, ShoppingBag } from 'lucide-react';
import { storeReviewService } from '../../services/storeReviewService';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const ReviewsSection = () => {
  const [storeReviews, setStoreReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await storeReviewService.fetchStoreReviews();
        setStoreReviews(data || []);
      } catch (err) {
        console.error('Error loading store reviews:', err);
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

  const socialReviews = storeReviews.filter(r => r.image_url);

  const displayWrittenReviews = storeReviews
    .filter(r => !r.image_url)
    .map(r => ({
      id: r.id,
      name: r.name || null,
      location: r.location || null,
      rating: r.rating,
      comment: r.comment || null,
      date: formatDate(r.created_at)
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  if (!loading && socialReviews.length === 0 && displayWrittenReviews.length === 0) {
    return null;
  }

  return (
    <section id="reviews" className="py-16 sm:py-24 bg-slate-50 dark:bg-black border-t border-slate-200/40 dark:border-white/5 transition-colors duration-300 w-full overflow-hidden">

      {/* Dynamic Style Block for Marquee Slide Train */}
      <style dangerouslySetInnerHTML={{
        __html: `@keyframes marquee-reviews{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}.animate-marquee-reviews-track{display:flex;width:max-content;animation:marquee-reviews 38s linear infinite;}.animate-marquee-reviews-track:hover{animation-play-state:paused;}.animate-marquee-social-track{display:flex;width:max-content;animation:marquee-reviews 42s linear infinite;}.animate-marquee-social-track:hover{animation-play-state:paused;}.mask-reviews-sides{position:relative;}.mask-reviews-sides::before,.mask-reviews-sides::after{content:"";position:absolute;top:0;bottom:0;width:80px;z-index:10;pointer-events:none;}.mask-reviews-sides::before{left:0;background:linear-gradient(to right,rgb(255,255,255),rgba(255,255,255,0));}.mask-reviews-sides::after{right:0;background:linear-gradient(to left,rgb(255,255,255),rgba(255,255,255,0));}.dark .mask-reviews-sides::before{background:linear-gradient(to right,rgb(0,0,0),rgba(0,0,0,0));}.dark .mask-reviews-sides::after{background:linear-gradient(to left,rgb(0,0,0),rgba(0,0,0,0));}`
      }} />

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
            Customer Reviews
          </motion.h2>
          <motion.p
            {...fadeUp(0.2)}
            className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed"
          >
            Real feedback from design and jewelry lovers across our store and social media pages.
          </motion.p>
        </div>

        {/* ── SOCIAL SCREENSHOTS PROOFS ── */}
        {socialReviews.length > 0 && (
          <div className="mask-reviews-sides overflow-hidden w-full py-4 mb-20">
            <div className="animate-marquee-social-track flex gap-8">
              {[...socialReviews, ...socialReviews].map((review, idx) => {
                const isWhatsApp = review.platform === 'whatsapp';
                const isInstagram = review.platform === 'instagram';

                let headerColor = "text-[#ff2a85]";
                let headerText = "Customer Review Share";
                let HeaderIcon = Sparkles;

                if (isWhatsApp) {
                  headerColor = "text-[#25d366]";
                  headerText = "WhatsApp Chat Proof";
                  HeaderIcon = MessageCircle;
                } else if (isInstagram) {
                  headerColor = "text-[#e1306c]";
                  headerText = "Instagram Feed Post";
                  HeaderIcon = Instagram;
                }
                return (
                  <div
                    key={`${review.id}-${idx}`}
                    className="bg-white dark:bg-[#0c0c0d] border border-slate-200/60 dark:border-[#1c1c1e] p-3 rounded-3xl shadow-sm flex flex-col items-center w-[280px] md:w-[320px] shrink-0 whitespace-normal hover:border-slate-350 dark:hover:border-[#2a2a2d] transition-all duration-300"
                  >
                    <div className="w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-[#26262a] shadow-sm bg-slate-50">
                      <img
                        src={review.image_url}
                        alt="Social Review"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── WRITTEN TESTIMONIALS ── */}
        {displayWrittenReviews.length > 0 && (
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

            <div className="mask-reviews-sides overflow-hidden w-full py-4">
              <div className="animate-marquee-reviews-track flex gap-6">
                {[...displayWrittenReviews, ...displayWrittenReviews].map((review, idx) => (
                  <div
                    key={`${review.id || idx}-${idx}`}
                    className="bg-white dark:bg-[#0c0c0d] border border-slate-200/60 dark:border-[#1c1c1e] p-6 rounded-2xl relative shadow-sm flex flex-col justify-between hover:border-slate-350 dark:hover:border-[#2a2a2d] transition-all duration-300 w-[320px] md:w-[380px] shrink-0 whitespace-normal"
                  >
                    <div className="space-y-3">
                      <Quote className="text-rose-500/10 absolute top-4 right-4 h-10 w-10 pointer-events-none" />

                      <div className="flex gap-0.5 text-rose-500">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>

                      {review.comment && (
                        <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                          "{review.comment}"
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {review.name && (
                            <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 flex items-center justify-center text-xs font-bold uppercase">
                              {review.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            {review.name && (
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{review.name}</h4>
                            )}
                            {review.location && (
                              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{review.location}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{review.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};

export default ReviewsSection;
