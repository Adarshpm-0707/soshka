import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { storeReviewService } from '../../services/storeReviewService';
import { showToast } from '../../components/Reusable/Toast';
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
  Image,
  Sparkles
} from 'lucide-react';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, written, social
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSocial, setIsSocial] = useState(false);
  const [platform, setPlatform] = useState('other'); // whatsapp, instagram, other
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await storeReviewService.fetchStoreReviews();
      setReviews(data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      showToast(err.message || 'Failed to fetch reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'warning');
      return;
    }

    setUploadingImage(true);
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

      setImageUrl(publicUrl);
      showToast('Review image uploaded successfully!', 'success');
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    showToast('Image removed', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      showToast('Customer Name and Review Comment are required', 'warning');
      return;
    }

    if (isSocial && !imageUrl) {
      showToast('Please upload an image for social review', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await storeReviewService.createStoreReview({
        name: name.trim(),
        location: location.trim() || null,
        rating,
        comment: comment.trim(),
        image_url: isSocial ? imageUrl : null,
        platform: isSocial ? platform : 'other'
      });

      showToast('Review created successfully!', 'success');
      resetForm();
      setShowAddModal(false);
      await fetchReviews();
    } catch (err) {
      console.error('Error creating review:', err);
      showToast(err.message || 'Failed to create review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await storeReviewService.deleteStoreReview(deleteId);
      showToast('Review deleted successfully', 'success');
      setDeleteId(null);
      await fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      showToast(err.message || 'Failed to delete review', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setRating(5);
    setComment('');
    setIsSocial(false);
    setPlatform('other');
    setImageUrl('');
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.location && review.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const isWritten = !review.image_url;
    const isSocialReview = !!review.image_url;

    if (typeFilter === 'written') return matchesSearch && isWritten;
    if (typeFilter === 'social') return matchesSearch && isSocialReview;
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
          <h1 className="text-3xl font-extrabold tracking-tight">Store Reviews & Testimonials</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage public testimonials, WhatsApp screenshots, and Instagram feed reviews.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="inline-flex items-center justify-center px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2a85] to-purple-650 hover:opacity-95 text-white font-bold text-sm shadow-md transition duration-200"
        >
          <Plus size={16} className="mr-2" />
          Add Testimonial
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Search */}
        <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-[#1c1c1e] rounded-xl px-4 py-3 shadow-sm max-w-md flex-grow">
          <Search size={18} className="text-slate-450 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search by customer name, location, comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm w-full outline-none border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-[#1c1c1e] self-start md:self-auto">
          {[
            { id: 'all', label: 'All Reviews' },
            { id: 'written', label: 'Written Only' },
            { id: 'social', label: 'Social (Images)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-200 ${
                typeFilter === tab.id
                  ? 'bg-slate-900 dark:bg-[#ff2a85] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-[#1c1c1e] max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Delete Testimonial?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Are you sure you want to delete this testimonial? It will be permanently removed from the database and will disappear from the public reviews page.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition flex items-center shadow-lg shadow-red-500/10"
              >
                {deleting && <Loader2 size={14} className="animate-spin mr-2" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-[#1c1c1e] max-w-xl w-full rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-lg font-black tracking-tight">Create Store Testimonial</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Switcher */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Review Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSocial(false)}
                    className={`py-3 rounded-xl border font-bold text-xs transition duration-200 flex flex-col items-center justify-center gap-1 ${
                      !isSocial
                        ? 'bg-slate-900 dark:bg-[#ff2a85] text-white border-transparent shadow-lg shadow-pink-500/10'
                        : 'bg-transparent text-slate-500 border-slate-200 dark:border-[#26262a] hover:border-slate-400'
                    }`}
                  >
                    <span>Written Testimonial</span>
                    <span className="text-[9px] opacity-75 font-medium">Text Description Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSocial(true)}
                    className={`py-3 rounded-xl border font-bold text-xs transition duration-200 flex flex-col items-center justify-center gap-1 ${
                      isSocial
                        ? 'bg-slate-900 dark:bg-[#ff2a85] text-white border-transparent shadow-lg shadow-pink-500/10'
                        : 'bg-transparent text-slate-500 border-slate-200 dark:border-[#26262a] hover:border-slate-400'
                    }`}
                  >
                    <span>Social Media Post</span>
                    <span className="text-[9px] opacity-75 font-medium">Image + Comment/Caption</span>
                  </button>
                </div>
              </div>

              {/* Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="reviewer-name" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Customer Name *
                  </label>
                  <input
                    id="reviewer-name"
                    type="text"
                    placeholder="e.g. Ananya Iyer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="reviewer-location" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Location / City (Optional)
                  </label>
                  <input
                    id="reviewer-location"
                    type="text"
                    placeholder="e.g. Mumbai, MH"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Rating & Social Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="reviewer-rating" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Rating (1-5 Stars)
                  </label>
                  <select
                    id="reviewer-rating"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm outline-none transition"
                  >
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★☆</option>
                    <option value={3}>3 Stars ★★★☆☆</option>
                    <option value={2}>2 Stars ★★☆☆☆</option>
                    <option value={1}>1 Star ★☆☆☆☆</option>
                  </select>
                </div>

                {isSocial && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label htmlFor="social-platform" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Social Platform
                    </label>
                    <select
                      id="social-platform"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm outline-none transition"
                    >
                      <option value="whatsapp">WhatsApp Conversation</option>
                      <option value="instagram">Instagram Post / Feed</option>
                      <option value="other">Other / Shared Screenshot</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Comment / Description */}
              <div className="space-y-1.5">
                <label htmlFor="reviewer-comment" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {isSocial ? 'Image Caption / Description *' : 'Review Description *'}
                </label>
                <textarea
                  id="reviewer-comment"
                  rows={4}
                  placeholder={isSocial ? 'e.g. "Obsessed with this ring stack from @soshka.in ✨"' : 'Customer feedback comment text here...'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-[#26262a] focus:border-[#ff2a85] text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm outline-none transition resize-none placeholder:text-slate-500"
                />
              </div>

              {/* Image Upload Area (Social reviews only) */}
              {isSocial && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Upload Screenshot *
                  </label>
                  
                  {imageUrl ? (
                    <div className="relative w-full max-w-[280px] aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-[#26262a] bg-slate-100 dark:bg-slate-950 mx-auto">
                      <img src={imageUrl} alt="Review upload preview" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-red-600 hover:bg-red-750 text-white rounded-xl shadow-md transition"
                        title="Remove Image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-40 border-2 border-dashed border-slate-300 dark:border-[#26262a] hover:border-[#ff2a85] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 dark:bg-slate-950 group">
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Uploading file...</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-slate-450 group-hover:text-[#ff2a85] transition-colors" />
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
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-[#1c1c1e] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2a85] to-purple-650 hover:opacity-95 text-white font-bold text-sm shadow-md transition flex items-center justify-center"
                >
                  {submitting && <Loader2 size={16} className="animate-spin mr-2" />}
                  Add Review
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Reviews Table / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-[#1c1c1e] rounded-3xl shadow-sm">
          <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
          <p className="text-xs font-semibold text-slate-450">Loading testimonials catalogue...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-24 text-center text-slate-450 dark:text-slate-500 bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-[#1c1c1e] rounded-3xl shadow-sm font-semibold">
          No store reviews or testimonials registered in catalog.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c0c0d] border border-slate-200 dark:border-[#1c1c1e] rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-[#1c1c1e] text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  <th className="py-4 px-6 w-[25%]">Customer Profile</th>
                  <th className="py-4 px-6 w-[15%]">Type</th>
                  <th className="py-4 px-6 w-[15%]">Rating</th>
                  <th className="py-4 px-6 w-[35%]">Review Details</th>
                  <th className="py-4 px-6 w-[10%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1c1c1e] text-sm font-semibold">
                {filteredReviews.map((review) => {
                  const isSocialReview = !!review.image_url;
                  return (
                    <tr key={review.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.005] transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <span className="text-slate-800 dark:text-slate-150 font-bold block">{review.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">{review.location || 'Location undisclosed'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {isSocialReview ? (
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                              {getPlatformIcon(review.platform)}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400">Social</span>
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
                              alt="Screenshot preview" 
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50"
                            />
                          )}
                          <span className="text-slate-650 dark:text-slate-350 text-xs font-medium line-clamp-2 max-w-[280px]">
                            {review.comment}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <button
                            onClick={() => setDeleteId(review.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 transition-all"
                            title="Delete Testimonial"
                          >
                            <Trash2 size={16} />
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
  );
};

export default AdminReviewsPage;
