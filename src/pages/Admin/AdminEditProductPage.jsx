import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Upload, Trash2, Loader2 } from 'lucide-react';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';
import { adminLogService } from '../../services/adminLogService';

const AdminEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('');
  const [offerId, setOfferId] = useState('');
  const [sku, setSku] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  const handleOriginalPriceChange = (val) => {
    setOriginalPrice(val);
    if (val && discountPercent) {
      const orig = Number(val);
      const pct = Number(discountPercent);
      if (orig > 0 && pct >= 0 && pct <= 100) {
        const calculatedOffer = orig - (orig * pct) / 100;
        setOfferPrice(Math.round(calculatedOffer).toString());
      }
    }
  };

  const handleDiscountChange = (val) => {
    setDiscountPercent(val);
    if (originalPrice && val) {
      const orig = Number(originalPrice);
      const pct = Number(val);
      if (orig > 0 && pct >= 0 && pct <= 100) {
        const calculatedOffer = orig - (orig * pct) / 100;
        setOfferPrice(Math.round(calculatedOffer).toString());
      }
    } else {
      setOfferPrice('');
    }
  };

  const handleOfferPriceChange = (val) => {
    setOfferPrice(val);
    if (originalPrice && val) {
      const orig = Number(originalPrice);
      const offer = Number(val);
      if (orig > 0 && offer >= 0 && offer <= orig) {
        const calculatedPercent = Math.round(((orig - offer) / orig) * 100);
        setDiscountPercent(calculatedPercent.toString());
      }
    } else {
      setDiscountPercent('');
    }
  };

  // Exactly 3 image slots
  const [images, setImages] = useState(['', '', '']);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load categories
        const { data: catData, error: catErr } = await supabase.from('categories').select('*');
        if (catErr) throw catErr;
        setCategories(catData || []);

        // Load offers
        const { data: offData, error: offErr } = await supabase.from('offers').select('*');
        if (offErr) throw offErr;
        setOffers(offData || []);

        // Load current product data
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (prodErr) throw prodErr;

        if (prodData) {
          setName(prodData.name || '');
          setDescription(prodData.description || '');
          setCategory(prodData.category || '');
          setCategoryId(prodData.category_id || '');
          const orig = prodData.original_price ?? prodData.price ?? '';
          const offer = prodData.offer_price ?? '';
          setOriginalPrice(orig);
          setOfferPrice(offer);
          setStock(prodData.stock ?? '');
          setOfferId(prodData.offer_id || '');
          setSku(prodData.sku ?? '');

          if (orig && offer) {
            const calculatedPercent = Math.round(((Number(orig) - Number(offer)) / Number(orig)) * 100);
            setDiscountPercent(calculatedPercent.toString());
          } else {
            setDiscountPercent('');
          }
          
          // Ensure we have exactly 3 slots
          const productImages = prodData.images || [];
          const paddedImages = [
            productImages[0] || '',
            productImages[1] || '',
            productImages[2] || '',
          ];
          setImages(paddedImages);
        }
      } catch (err) {
        console.error('Error fetching edit page data:', err);
        showToast('Error loading product parameters', 'error');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    setCategoryId(catId);
    const selected = categories.find((c) => c.id === catId);
    setCategory(selected ? selected.name : '');
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${id}-slot-${index}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      const updatedImages = [...images];
      updatedImages[index] = publicUrl;
      setImages(updatedImages);
      showToast(`Image ${index + 1} uploaded successfully!`, 'success');
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (index) => {
    const updatedImages = [...images];
    updatedImages[index] = '';
    setImages(updatedImages);
    showToast(`Image ${index + 1} removed`, 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !originalPrice || !stock || !category) {
      showToast('Please fill out all required fields.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const { error } = await supabase
        .from('products')
        .update({
          name,
          slug,
          description,
          category,
          category_id: categoryId || null,
          price: Number(originalPrice), // sync original price to price
          original_price: Number(originalPrice),
          offer_price: offerPrice ? Number(offerPrice) : null,
          discount_price: offerPrice ? Number(offerPrice) : null,
          stock: Number(stock),
          offer_id: offerId || null,
          images, // exactly 3 slots
          sku,
        })
        .eq('id', id);

      if (error) throw error;

      // Log update in admin_logs
      await adminLogService.logAction('updated_product', 'products', id, { name });

      showToast('Product updated successfully!', 'success');
      navigate('/admin/products');
    } catch (err) {
      console.error('Error updating product:', err);
      showToast(err.message || 'Error updating product', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
        <p className="text-sm font-semibold text-slate-500">Loading product parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Edit Product</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Modify details for: <span className="font-extrabold text-[#ff2a85]">{name}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
          
          {/* Left Column Fields */}
          <div className="space-y-4">
            <Input
              label="Product Name"
              id="name"
              placeholder="e.g. Solitaire Diamond Ring"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              label="Description"
              id="description"
              type="textarea"
              rows={4}
              placeholder="Detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={handleCategoryChange}
                required
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">-- Choose Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Original Price *"
                id="originalPrice"
                type="number"
                placeholder="75000"
                value={originalPrice}
                onChange={(e) => handleOriginalPriceChange(e.target.value)}
                required
                disabled={loading}
              />

              <Input
                label="Discount (%)"
                id="discountPercent"
                type="number"
                placeholder="10"
                value={discountPercent}
                onChange={(e) => handleDiscountChange(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Offer Price (Promo)"
                id="offerPrice"
                type="number"
                placeholder="68000"
                value={offerPrice}
                onChange={(e) => handleOfferPriceChange(e.target.value)}
                disabled={loading}
              />

              <Input
                label="SKU"
                id="sku"
                placeholder="SS-XXXX"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stock Quantity *"
                id="stock"
                type="number"
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                disabled={loading}
              />

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Link active campaign
                </label>
                <select
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary-500"
                >
                  <option value="">-- Select Active Offer (Optional) --</option>
                  {offers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.title} ({off.discount_percent}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery slots */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase">Product Gallery</h3>
            <p className="text-slate-400 text-xs mt-0.5">Please provide exactly 3 product image assets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {images.map((imgUrl, index) => (
              <div key={index} className="flex flex-col items-center space-y-3 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl relative overflow-hidden">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Image {index + 1}</span>
                
                {imgUrl ? (
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <img src={imgUrl} alt={`Preview ${index + 1}`} className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg shadow-md transition"
                      title="Remove Image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="w-full aspect-square border-2 border-dashed border-slate-350 dark:border-slate-800 hover:border-[#ff2a85] rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-white dark:bg-slate-900 group">
                    {uploadingIndex === index ? (
                      <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8" />
                    ) : (
                      <>
                        <Upload size={22} className="text-slate-400 group-hover:text-[#ff2a85] transition-colors" />
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wide mt-2">Upload asset</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, index)}
                      disabled={uploadingIndex !== null}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/products')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="px-6 font-bold text-sm bg-gradient-to-r from-primary-600 to-pink-600 hover:from-primary-700 hover:to-pink-700 border-none transition duration-200"
            loading={loading}
            disabled={loading}
          >
            Update Product
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditProductPage;
