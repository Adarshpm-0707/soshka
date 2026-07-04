import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Instagram, Quote, Sparkles, Loader2 } from 'lucide-react';
import { storeReviewService } from '../../services/storeReviewService';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
};

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getReviews = async () => {
      try {
        const data = await storeReviewService.fetchStoreReviews();
        setReviews(data || []);
      } catch (err) {
        console.error('Failed to fetch store reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    getReviews();
  }, []);

  const socialReviews = reviews.filter(r => r.image_url);
  
  const combinedWrittenReviews = reviews
    .filter(r => r.comment)
    .map(r => ({
      id: r.id,
      name: r.name,
      location: r.location || 'Verified Buyer',
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="bg-white dark:bg-black text-slate-900 dark:text-white min-h-screen transition-colors duration-300 overflow-hidden">
      
      {/* Dynamic Style Block for Marquee Slide Train */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-reviews {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-reviews-track {
          display: flex;
          width: max-content;
          animation: marquee-reviews 38s linear infinite;
        }
        .animate-marquee-reviews-track:hover {
          animation-play-state: paused;
        }
        .animate-marquee-social-track {
          display: flex;
          width: max-content;
          animation: marquee-reviews 42s linear infinite;
        }
        .animate-marquee-social-track:hover {
          animation-play-state: paused;
        }
        .mask-reviews-sides {
          position: relative;
        }
        .mask-reviews-sides::before,
        .mask-reviews-sides::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          z-index: 10;
          pointer-events: none;
        }
        .mask-reviews-sides::before {
          left: 0;
          background: linear-gradient(to right, rgb(255, 255, 255), rgba(255, 255, 255, 0));
        }
        .mask-reviews-sides::after {
          right: 0;
          background: linear-gradient(to left, rgb(255, 255, 255), rgba(255, 255, 255, 0));
        }
        .dark .mask-reviews-sides::before {
          background: linear-gradient(to right, rgb(0, 0, 0), rgba(0, 0, 0, 0));
        }
        .dark .mask-reviews-sides::after {
          background: linear-gradient(to left, rgb(0, 0, 0), rgba(0, 0, 0, 0));
        }
      `}} />

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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28">
          <Loader2 className="animate-spin text-rose-500 h-8 w-8 mb-2" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading feedback catalog...</p>
        </div>
      ) : (
        <>
          {/* ── SOCIAL SCREENSHOTS SECTION ── */}
          {socialReviews.length > 0 && (
            <section className="py-14 sm:py-20 border-b border-slate-100 dark:border-white/5">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <motion.div {...fadeUp()} className="text-center mb-12 sm:mb-16">
                  <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                    Shared on Social Media
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Screenshots sent by our shoppers on Instagram and WhatsApp chat lines.
                  </p>
                </motion.div>

                <div className="mask-reviews-sides overflow-hidden w-full py-4">
                  <div className="animate-marquee-social-track flex gap-8">
                    {[...socialReviews, ...socialReviews].map((review, idx) => {
                      const isWhatsApp = review.platform === 'whatsapp';
                      const isInstagram = review.platform === 'instagram';
                      
                      let headerColor = "text-[#ff2a85]";
                      let headerText = "Customer Review Share";
                      let HeaderIcon = Sparkles;
                      
                      if (isWhatsApp) {
                        headerColor = "text-[#25d366]";
                        headerText = "WhatsApp chat review";
                        HeaderIcon = MessageCircle;
                      } else if (isInstagram) {
                        headerColor = "text-[#e1306c]";
                        headerText = "Instagram Feed post";
                        HeaderIcon = Instagram;
                      }

                      return (
                        <div 
                          key={`${review.id}-${idx}`}
                          className="bg-slate-50 dark:bg-[#0c0c0d] border border-slate-100 dark:border-[#1c1c1e] p-6 rounded-3xl shadow-sm flex flex-col items-center w-[280px] md:w-[320px] shrink-0 whitespace-normal hover:border-slate-250 dark:hover:border-[#2a2a2d] transition-all duration-300"
                        >
                          <div className={`flex items-center gap-2 mb-4 ${headerColor} font-bold text-xs uppercase tracking-wider self-start`}>
                            <HeaderIcon size={16} fill={isWhatsApp ? "currentColor" : "none"} />
                            <span>{headerText}</span>
                          </div>
                          <div className="w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-[#26262a] shadow-sm bg-white">
                            <img 
                              src={review.image_url} 
                              alt={`${review.name}'s Social Review`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center mt-4 px-2 leading-relaxed font-medium">
                            "{review.comment}"
                          </p>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-2">
                            — {review.name} {review.location ? `(${review.location})` : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* ── WRITTEN TESTIMONIALS SECTION ── */}
          {combinedWrittenReviews.length > 0 && (
            <section className="py-14 sm:py-20 bg-slate-50/50 dark:bg-neutral-950/20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
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

                <div className="mask-reviews-sides overflow-hidden w-full py-4">
                  <div className="animate-marquee-reviews-track flex gap-8">
                    {[...combinedWrittenReviews, ...combinedWrittenReviews].map((review, idx) => (
                      <div 
                        key={`${review.id}-${idx}`}
                        className="bg-white dark:bg-[#0c0c0d] border border-slate-100 dark:border-[#1c1c1e] p-6 rounded-2xl relative shadow-sm flex flex-col justify-between w-[320px] md:w-[380px] shrink-0 whitespace-normal hover:border-slate-200 dark:hover:border-[#2a2a2d] transition-all duration-300"
                      >
                        <div className="space-y-4">
                          <Quote className="text-rose-500/20 absolute top-4 right-4 h-10 w-10 pointer-events-none" />
                          <div className="flex gap-0.5 text-rose-500">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} size={12} fill="currentColor" />
                            ))}
                          </div>
                          <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed font-medium">
                            "{review.comment}"
                          </p>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{review.name}</h4>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{review.location}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{getRelativeTime(review.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* Fallback empty state */}
          {reviews.length === 0 && (
            <div className="py-24 text-center max-w-md mx-auto px-4">
              <Sparkles className="mx-auto text-rose-500 animate-pulse h-12 w-12 mb-4" />
              <h2 className="text-xl font-extrabold tracking-tight mb-2">No Reviews Yet</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                We are currently gathering verified testimonials. Check back soon to see feedback from our design community!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewsPage;
