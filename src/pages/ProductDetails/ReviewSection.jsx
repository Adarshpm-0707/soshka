import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { reviewService } from '../../services/reviewService';
import { Star, ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';
import { showToast } from '../../components/Reusable/Toast';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';

const ReviewSection = ({ productId, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const LIMIT = 5;

  // New review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewService.getProductReviews(productId, page, LIMIT);
      setReviews(data.reviews);
      setTotalReviews(data.totalCount);
    } catch (err) {
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!comment.trim() || comment.trim().length < 5) {
      setSubmitError('Review comment must be at least 5 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.createReview({
        userId: user.id,
        productId,
        rating,
        comment: comment.trim()
      });
      showToast('Thank you! Review submitted.', 'success');
      setComment('');
      setRating(5);
      setPage(1);
      // Refresh reviews list
      await fetchReviews();
      // Notify parent to refetch product rating & count
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      setSubmitError(err.message || 'Error submitting review.');
      showToast('Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalReviews / LIMIT);

  return (
    <div className="space-y-8 mt-12 pt-10 border-t border-slate-200 dark:border-slate-800">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white font-sans">
        Customer Reviews ({totalReviews})
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left side: Write a review form (only if logged in) */}
        <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm h-fit">
          {user ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">
                Write a Review
              </h4>

              {submitError && (
                <div className="flex items-center space-x-2 p-3 bg-red-50/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
                  <ShieldAlert size={14} className="flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Star selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-400 block">
                  Rating
                </span>
                <div className="flex space-x-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-amber-400 transition transform active:scale-110"
                    >
                      <Star
                        size={22}
                        fill={star <= rating ? 'currentColor' : 'none'}
                        className={star <= rating ? 'text-amber-400' : 'text-slate-350 dark:text-slate-600'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Input details */}
              <Input
                label="Review Comment"
                id="comment"
                type="textarea"
                placeholder="Share your thoughts about this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                disabled={submitting}
              />

              <Button
                type="submit"
                className="w-full"
                loading={submitting}
                disabled={submitting}
              >
                Submit Review
              </Button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Please log in to submit a review for this product.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast('Redirecting to login...', 'info')}
                className="inline-flex"
              >
                Sign In
              </Button>
            </div>
          )}
        </div>

        {/* Right side: Reviews list */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl p-4 h-24" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-450 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              No reviews yet. Be the first to share your experience!
            </div>
          ) : (
            <>
              {/* Reviews Items */}
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={rev.profile?.avatar_url || 'https://via.placeholder.com/150'}
                          alt={rev.profile?.name}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-850"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {rev.profile?.name || 'Anonymous'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < rev.rating ? 'currentColor' : 'none'}
                            className={i < rev.rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 pl-1">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    icon={ArrowLeft}
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-semibold text-slate-500">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ArrowRight size={14} className="ml-2 inline" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
