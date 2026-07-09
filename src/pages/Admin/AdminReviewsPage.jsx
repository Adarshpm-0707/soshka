import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { storeReviewService } from '../../services/storeReviewService';
import { reviewService } from '../../services/reviewService';
import { showToast } from '../../components/Reusable/Toast';
import ConfirmModal from '../../components/Reusable/ConfirmModal';
import { 
  Star, 
  Trash2, 
  Plus, 
  Search, 
  AlertTriangle, 
  Loader2, 
  Upload, 
  X, 
  MessageCircle, 
  Instagram, 
  ShoppingBag,
  Edit2,
  Sparkles
} from 'lucide-react';

const AdminReviewsPage = () => {
  const [activeMainTab, setActiveMainTab] = useState('testimonials'); // 'testimonials' or 'productReviews'
  
  // ==========================================
  // STATE: STORE TESTIMONIALS
  // ==========================================
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [testimonialSearch, setTestimonialSearch] = useState('');
  const [testimonialTypeFilter, setTestimonialTypeFilter] = useState('all'); // all, written, social
  
  // Testimonial Form / Modal State
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null); // null for create, object for edit
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialDeleteId, setTestimonialDeleteId] = useState(null);
  const [testimonialDeleting, setTestimonialDeleting] = useState(false);

  // Testimonial Form Fields
  const [tName, setTName] = useState('');
  const [tLocation, setTLocation] = useState('');
  const [tRating, setTRating] = useState(5);
  const [tComment, setTComment] = useState('');
  const [tIsSocial, setTIsSocial] = useState(false);
  const [tPlatform, setTPlatform] = useState('other'); // whatsapp, instagram, other
  const [tImageUrl, setTImageUrl] = useState('');
  const [tUploadingImage, setTUploadingImage] = useState(false);

  // ==========================================
  // STATE: PRODUCT REVIEWS
  // ==========================================
  const [productReviews, setProductReviews] = useState([]);
  const [prodReviewsLoading, setProdReviewsLoading] = useState(true);
  const [prodReviewSearch, setProdReviewSearch] = useState('');
  
  // Product Review Form / Modal State
  const [showProdEditModal, setShowProdEditModal] = useState(false);
  const [editingProdReview, setEditingProdReview] = useState(null); // object for edit
  const [prodReviewSubmitting, setProdReviewSubmitting] = useState(false);
  const [prodReviewDeleteId, setProdReviewDeleteId] = useState(null);
  const [prodReviewDeleteProductId, setProdReviewDeleteProductId] = useState(null);
  const [prodReviewDeleting, setProdReviewDeleting] = useState(false);

  // Product Review Form Fields
  const [prRating, setPrRating] = useState(5);
  const [prComment, setPrComment] = useState('');

  // ==========================================
  // EFFECTS & FETCHES
  // ==========================================
  const fetchTestimonials = async () => {
    setTestimonialsLoading(true);
    try {
      const data = await storeReviewService.fetchStoreReviews();
      setTestimonials(data);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      showToast(err.message || 'Failed to fetch testimonials', 'error');
    } finally {
      setTestimonialsLoading(false);
    }
  };

  const fetchProductReviews = async () => {
    setProdReviewsLoading(true);
    try {
      const data = await reviewService.fetchAllProductReviews();
      setProductReviews(data);
    } catch (err) {
      console.error('Error fetching product reviews:', err);
      showToast(err.message || 'Failed to fetch product reviews', 'error');
    } finally {
      setProdReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
    fetchProductReviews();
  }, []);

  // ==========================================
  // HANDLERS: STORE TESTIMONIALS
  // ==========================================
  const handleTImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'warning');
      return;
    }

    setTUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `review-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `review-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setTImageUrl(publicUrl);
      showToast('Review image uploaded successfully!', 'success');
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setTUploadingImage(false);
    }
  };

  const handleOpenEditTestimonial = (testimonial) => {
    setEditingTestimonial(testimonial);
    setTName(testimonial.name || '');
    setTLocation(testimonial.location || '');
    setTRating(testimonial.rating);
    setTComment(testimonial.comment || '');
    setTIsSocial(!!testimonial.image_url);
    setTPlatform(testimonial.platform || 'other');
    setTImageUrl(testimonial.image_url || '');
    setShowTestimonialModal(true);
  };

  const handleOpenAddTestimonial = () => {
    setEditingTestimonial(null);
    setTName('');
    setTLocation('');
    setTRating(5);
    setTComment('');
    setTIsSocial(false);
    setTPlatform('other');
    setTImageUrl('');
    setShowTestimonialModal(true);
  };

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    if (tIsSocial && !tImageUrl) {
      showToast('Please upload an image for social review', 'warning');
      return;
    }

    setTestimonialSubmitting(true);
    try {
      const payload = {
        name: tName.trim() || null,
        location: tLocation.trim() || null,
        rating: tRating,
        comment: tComment.trim() || null,
        image_url: tIsSocial ? tImageUrl : null,
        platform: tIsSocial ? tPlatform : 'other'
      };

      if (editingTestimonial) {
        await storeReviewService.updateStoreReview(editingTestimonial.id, payload);
        showToast('Testimonial updated successfully!', 'success');
      } else {
        await storeReviewService.createStoreReview(payload);
        showToast('Testimonial created successfully!', 'success');
      }

      setShowTestimonialModal(false);
      await fetchTestimonials();
    } catch (err) {
      console.error('Error saving testimonial:', err);
      showToast(err.message || 'Failed to save testimonial', 'error');
    } finally {
      setTestimonialSubmitting(false);
    }
  };

  const handleTestimonialDelete = async () => {
    if (!testimonialDeleteId) return;
    setTestimonialDeleting(true);
    try {
      await storeReviewService.deleteStoreReview(testimonialDeleteId);
      showToast('Testimonial deleted successfully', 'success');
      setTestimonialDeleteId(null);
      await fetchTestimonials();
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      showToast(err.message || 'Failed to delete testimonial', 'error');
    } finally {
      setTestimonialDeleting(false);
    }
  };

  // ==========================================
  // HANDLERS: PRODUCT REVIEWS
  // ==========================================
  const handleOpenEditPrReview = (review) => {
    setEditingProdReview(review);
    setPrRating(review.rating);
    setPrComment(review.comment || '');
    setShowProdEditModal(true);
  };

  const handleProdReviewSubmit = async (e) => {
    e.preventDefault();
    if (!editingProdReview) return;

    setProdReviewSubmitting(true);
    try {
      await reviewService.updateReview(editingProdReview.id, editingProdReview.product_id, {
        rating: prRating,
        comment: prComment.trim()
      });
      showToast('Product review updated successfully!', 'success');
      setShowProdEditModal(false);
      await fetchProductReviews();
    } catch (err) {
      console.error('Error updating product review:', err);
      showToast(err.message || 'Failed to update review', 'error');
    } finally {
      setProdReviewSubmitting(false);
    }
  };

  const handleProdReviewDelete = async () => {
    if (!prodReviewDeleteId || !prodReviewDeleteProductId) return;
    setProdReviewDeleting(true);
    try {
      await reviewService.deleteReview(prodReviewDeleteId, prodReviewDeleteProductId);
      showToast('Product review deleted successfully', 'success');
      setProdReviewDeleteId(null);
      setProdReviewDeleteProductId(null);
      await fetchProductReviews();
    } catch (err) {
      console.error('Error deleting product review:', err);
      showToast(err.message || 'Failed to delete review', 'error');
    } finally {
      setProdReviewDeleting(false);
    }
  };

  // ==========================================
  // FILTERS
  // ==========================================
  const filteredTestimonials = testimonials.filter(review => {
    const matchesSearch = !testimonialSearch ||
      (review.name && review.name.toLowerCase().includes(testimonialSearch.toLowerCase())) ||
      (review.comment && review.comment.toLowerCase().includes(testimonialSearch.toLowerCase())) ||
      (review.location && review.location.toLowerCase().includes(testimonialSearch.toLowerCase()));

    const isWritten = !review.image_url;
    const isSocialReview = !!review.image_url;

    if (testimonialTypeFilter === 'written') return matchesSearch && isWritten;
    if (testimonialTypeFilter === 'social') return matchesSearch && isSocialReview;
    return matchesSearch;
  });

  const filteredProdReviews = productReviews.filter(review => {
    const matchesSearch = !prodReviewSearch ||
      (review.profile?.name && review.profile.name.toLowerCase().includes(prodReviewSearch.toLowerCase())) ||
      (review.comment && review.comment.toLowerCase().includes(prodReviewSearch.toLowerCase())) ||
      (review.product?.name && review.product.name.toLowerCase().includes(prodReviewSearch.toLowerCase()));

    return matchesSearch;
  });

  const getPlatformIcon = (platform, size = 14) => {
    switch (platform) {
      case 'whatsapp':
        return <MessageCircle size={size} className="text-emerald-500 fill-emerald-500/10" />;
      case 'instagram':
        return <Instagram size={size} className="text-pink-500" />;
      default:
        return <Sparkles size={size} className="text-[#ff2a85]" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Reviews Registry</h1>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">
            Configure boutique store-wide testimonials and customer product feedback.
          </p>
        </div>
        {activeMainTab === 'testimonials' && (
          <button
            onClick={handleOpenAddTestimonial}
            className="inline-flex items-center justify-center px-4.5 py-2.5 rounded-xl bg-[#ff2a85] hover:opacity-90 text-white font-bold text-sm shadow-md shadow-pink-500/10 transition"
          >
            <Plus size={16} className="mr-2" />
            Add Testimonial
          </button>
        )}
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveMainTab('testimonials')}
          className={`pb-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition ${
            activeMainTab === 'testimonials'
              ? 'border-[#ff2a85] text-[#ff2a85]'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Store Testimonials ({testimonials.length})
        </button>
        <button
          onClick={() => setActiveMainTab('productReviews')}
          className={`pb-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition ${
            activeMainTab === 'productReviews'
              ? 'border-[#ff2a85] text-[#ff2a85]'
              : 'border-transparent text-slate-500 hover:text-slate-350'
          }`}
        >
          Product Customer Reviews ({productReviews.length})
        </button>
      </div>

      {/* VIEW: STORE TESTIMONIALS */}
      {activeMainTab === 'testimonials' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="flex items-center bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 shadow-sm max-w-md flex-grow">
              <Search size={18} className="text-slate-450 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search by customer name, location, comments..."
                value={testimonialSearch}
                onChange={(e) => setTestimonialSearch(e.target.value)}
                className="bg-transparent text-sm w-full outline-none border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-555"
              />
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-[#1c1c1e] self-start md:self-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'written', label: 'Written' },
                { id: 'social', label: 'Social' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTestimonialTypeFilter(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                    testimonialTypeFilter === tab.id
                      ? 'bg-slate-900 dark:bg-[#ff2a85] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {testimonialsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-slate-800/85 rounded-3xl shadow-sm">
              <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
              <p className="text-xs font-semibold text-slate-450">Loading testimonials...</p>
            </div>
          ) : filteredTestimonials.length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-slate-800/85 rounded-3xl shadow-sm">
              No store testimonials found matching criteria.
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-slate-800/85 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-4 px-6 w-[25%]">Customer Profile</th>
                      <th className="py-4 px-6 w-[15%]">Type</th>
                      <th className="py-4 px-6 w-[15%]">Rating</th>
                      <th className="py-4 px-6 w-[35%]">Review Details</th>
                      <th className="py-4 px-6 w-[10%] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-semibold">
                    {filteredTestimonials.map((review) => {
                      const isSocialReview = !!review.image_url;
                      return (
                        <tr key={review.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.005] transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <span className="text-slate-850 dark:text-slate-200 font-bold block">{review.name || 'Anonymous'}</span>
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium block">{review.location || 'Location undisclosed'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {isSocialReview ? (
                              <div className="flex items-center gap-1.5">
                                <span className="p-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850">
                                  {getPlatformIcon(review.platform)}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-450">Social</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-400">Written</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-0.5 text-rose-500 dark:text-[#ff2a85]">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={12} 
                                  fill={i < review.rating ? 'currentColor' : 'none'} 
                                  className={i < review.rating ? '' : 'text-slate-200 dark:text-slate-800'}
                                />
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              {isSocialReview && (
                                <img 
                                  src={review.image_url} 
                                  alt="" 
                                  className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50"
                                />
                              )}
                              <span className="text-slate-655 dark:text-slate-350 text-xs font-medium line-clamp-2 max-w-[280px]">
                                {review.comment || (isSocialReview ? 'No caption' : 'No description')}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center items-center space-x-2">
                              <button
                                onClick={() => handleOpenEditTestimonial(review)}
                                className="p-2 rounded-xl text-slate-400 hover:text-[#ff2a85] hover:bg-slate-100 dark:hover:bg-white/5 transition"
                                title="Edit Testimonial"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => setTestimonialDeleteId(review.id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                title="Delete Testimonial"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: PRODUCT REVIEWS */}
      {activeMainTab === 'productReviews' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="flex items-center bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 shadow-sm max-w-md flex-grow">
              <Search size={18} className="text-slate-455 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search by customer, product, or comment..."
                value={prodReviewSearch}
                onChange={(e) => setProdReviewSearch(e.target.value)}
                className="bg-transparent text-sm w-full outline-none border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {prodReviewsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-slate-800/85 rounded-3xl shadow-sm">
              <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
              <p className="text-xs font-semibold text-slate-450">Loading product reviews...</p>
            </div>
          ) : filteredProdReviews.length === 0 ? (
            <div className="py-20 text-center text-slate-500 bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-slate-800/85 rounded-3xl shadow-sm">
              No customer product reviews registered.
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-slate-800/85 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="py-4 px-6 w-[20%]">Customer</th>
                      <th className="py-4 px-6 w-[25%]">Product</th>
                      <th className="py-4 px-6 w-[15%]">Rating</th>
                      <th className="py-4 px-6 w-[30%]">Feedback Comment</th>
                      <th className="py-4 px-6 w-[10%] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-semibold">
                    {filteredProdReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.005] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            {review.profile?.avatar_url ? (
                              <img
                                src={review.profile.avatar_url}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-855 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                {(review.profile?.name || 'A').charAt(0)}
                              </div>
                            )}
                            <div>
                              <span className="text-slate-850 dark:text-slate-200 font-bold block">{review.profile?.name || 'Anonymous'}</span>
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium block">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            {review.product?.images && review.product.images[0] ? (
                              <img
                                src={review.product.images[0]}
                                alt=""
                                className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-slate-850 bg-slate-50"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 flex items-center justify-center text-slate-405">
                                <ShoppingBag size={14} />
                              </div>
                            )}
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[180px]">
                              {review.product?.name || 'Deleted Product'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-0.5 text-[#ff2a85]">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                fill={i < review.rating ? 'currentColor' : 'none'} 
                                className={i < review.rating ? '' : 'text-slate-200 dark:text-slate-800'}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs text-slate-655 dark:text-slate-350 font-medium line-clamp-2 max-w-[280px]">
                            {review.comment || <span className="italic text-slate-400">No comment left.</span>}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center items-center space-x-2">
                            <button
                              onClick={() => handleOpenEditPrReview(review)}
                              className="p-2 rounded-xl text-slate-400 hover:text-[#ff2a85] hover:bg-slate-100 dark:hover:bg-white/5 transition"
                              title="Edit Review"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setProdReviewDeleteId(review.id);
                                setProdReviewDeleteProductId(review.product_id);
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 transition-all"
                              title="Delete Review"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODALS & CUSTOM POPUPS
          ========================================== */}

      {/* Testimonial Add/Edit Modal */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto font-sans-luxury">
          <div className="bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-lg font-black tracking-tight uppercase font-serif-luxury text-rose-700 dark:text-[#ff2a85]">
                {editingTestimonial ? 'Edit Testimonial' : 'Create Store Testimonial'}
              </h3>
              <button 
                onClick={() => setShowTestimonialModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTestimonialSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450">Review Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTIsSocial(false)}
                    className={`py-3 rounded-xl border font-bold text-xs transition duration-200 flex flex-col items-center justify-center gap-1 ${
                      !tIsSocial
                        ? 'bg-slate-900 dark:bg-[#ff2a85] text-white border-transparent shadow-lg shadow-pink-500/10'
                        : 'bg-transparent text-slate-500 border-slate-200 dark:border-[#26262a] hover:border-slate-400'
                    }`}
                  >
                    <span>Written Testimonial</span>
                    <span className="text-[9px] opacity-75 font-medium">Text Description Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTIsSocial(true)}
                    className={`py-3 rounded-xl border font-bold text-xs transition duration-200 flex flex-col items-center justify-center gap-1 ${
                      tIsSocial
                        ? 'bg-slate-900 dark:bg-[#ff2a85] text-white border-transparent shadow-lg shadow-pink-500/10'
                        : 'bg-transparent text-slate-500 border-slate-200 dark:border-[#26262a] hover:border-slate-400'
                    }`}
                  >
                    <span>Social Media Post</span>
                    <span className="text-[9px] opacity-75 font-medium">Image + Comment/Caption</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="t-reviewer-name" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450">
                    Customer Name (Optional)
                  </label>
                  <input
                    id="t-reviewer-name"
                    type="text"
                    placeholder="e.g. Ananya Iyer"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="t-reviewer-location" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450">
                    Location / City (Optional)
                  </label>
                  <input
                    id="t-reviewer-location"
                    type="text"
                    placeholder="e.g. Mumbai, MH"
                    value={tLocation}
                    onChange={(e) => setTLocation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="t-reviewer-rating" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-455">
                    Rating (1-5 Stars)
                  </label>
                  <select
                    id="t-reviewer-rating"
                    value={tRating}
                    onChange={(e) => setTRating(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
                  >
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★☆</option>
                    <option value={3}>3 Stars ★★★☆☆</option>
                    <option value={2}>2 Stars ★★☆☆☆</option>
                    <option value={1}>1 Star ★☆☆☆☆</option>
                  </select>
                </div>

                {tIsSocial && (
                  <div className="space-y-1.5">
                    <label htmlFor="t-social-platform" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-455">
                      Social Platform
                    </label>
                    <select
                      id="t-social-platform"
                      value={tPlatform}
                      onChange={(e) => setTPlatform(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition"
                    >
                      <option value="whatsapp">WhatsApp Conversation</option>
                      <option value="instagram">Instagram Post / Feed</option>
                      <option value="other">Other / Shared Screenshot</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="t-reviewer-comment" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-455">
                  {tIsSocial ? 'Image Caption / Description (Optional)' : 'Review Description (Optional)'}
                </label>
                <textarea
                  id="t-reviewer-comment"
                  rows={4}
                  placeholder={tIsSocial ? 'e.g. "Obsessed with this ring stack from @soshka.in ✨"' : 'Customer feedback comment text here...'}
                  value={tComment}
                  onChange={(e) => setTComment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none transition resize-none placeholder:text-slate-550"
                />
              </div>

              {tIsSocial && (
                <div className="space-y-2 pt-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-455">
                    Upload Screenshot *
                  </label>
                  
                  {tImageUrl ? (
                    <div className="relative w-full max-w-[280px] aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-[#26262a] bg-slate-100 dark:bg-slate-950 mx-auto">
                      <img src={tImageUrl} alt="" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => setTImageUrl('')}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-red-650 hover:bg-red-750 text-white rounded-xl shadow-md transition"
                        title="Remove Image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-40 border-2 border-dashed border-slate-350 dark:border-[#26262a] hover:border-[#ff2a85] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 dark:bg-slate-950 group">
                      {tUploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Uploading file...</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-slate-450 group-hover:text-[#ff2a85] transition" />
                          <span className="text-xs font-bold text-slate-650 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-white tracking-wide mt-2">
                            Select screenshot image file
                          </span>
                          <span className="text-[9px] text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleTImageUpload}
                        disabled={tUploadingImage}
                      />
                    </label>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowTestimonialModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-305 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testimonialSubmitting || tUploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-[#ff2a85] hover:opacity-95 text-white font-bold text-xs shadow-md transition flex items-center justify-center"
                >
                  {testimonialSubmitting && <Loader2 size={14} className="animate-spin mr-2" />}
                  {editingTestimonial ? 'Save Changes' : 'Create Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Review Edit Modal */}
      {showProdEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto font-sans-luxury">
          <div className="bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-lg font-black tracking-tight uppercase font-serif-luxury text-rose-700 dark:text-[#ff2a85]">
                Edit Customer Review
              </h3>
              <button 
                onClick={() => setShowProdEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            {editingProdReview && (
              <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                {editingProdReview.product?.images && editingProdReview.product.images[0] && (
                  <img src={editingProdReview.product.images[0]} className="h-11 w-11 rounded-lg object-cover shrink-0" alt="" />
                )}
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Review for Product</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-250 block line-clamp-1">{editingProdReview.product?.name}</span>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 block">Submitted by {editingProdReview.profile?.name || 'Anonymous'}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleProdReviewSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="pr-rating" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450">
                  Customer Rating
                </label>
                <select
                  id="pr-rating"
                  value={prRating}
                  onChange={(e) => setPrRating(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none transition"
                >
                  <option value={5}>5 Stars ★★★★★</option>
                  <option value={4}>4 Stars ★★★★☆</option>
                  <option value={3}>3 Stars ★★★☆☆</option>
                  <option value={2}>2 Stars ★★☆☆☆</option>
                  <option value={1}>1 Star ★☆☆☆☆</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pr-comment" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-450">
                  Review Text Comment
                </label>
                <textarea
                  id="pr-comment"
                  rows={5}
                  value={prComment}
                  onChange={(e) => setPrComment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowProdEditModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-655 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prodReviewSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#ff2a85] hover:opacity-95 text-white font-bold text-xs shadow-md transition flex items-center justify-center"
                >
                  {prodReviewSubmitting && <Loader2 size={14} className="animate-spin mr-2" />}
                  Save Feedback Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deletion: Testimonial */}
      <ConfirmModal
        isOpen={!!testimonialDeleteId}
        onClose={() => setTestimonialDeleteId(null)}
        onConfirm={handleTestimonialDelete}
        title="Delete Testimonial?"
        message="Are you sure you want to permanently delete this testimonial? It will be removed from databases and public pages."
        confirmLabel="Delete"
        cancelLabel="Keep Testimonial"
        type="danger"
        isLoading={testimonialDeleting}
      />

      {/* Confirm Deletion: Product Review */}
      <ConfirmModal
        isOpen={!!prodReviewDeleteId}
        onClose={() => { setProdReviewDeleteId(null); setProdReviewDeleteProductId(null); }}
        onConfirm={handleProdReviewDelete}
        title="Delete Customer Review?"
        message="Are you sure you want to delete this customer feedback review? This will recalculate the product rating."
        confirmLabel="Delete"
        cancelLabel="Keep Review"
        type="danger"
        isLoading={prodReviewDeleting}
      />
    </div>
  );
};

export default AdminReviewsPage;
