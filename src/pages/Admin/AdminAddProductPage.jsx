import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Upload, Trash2, Loader2, Sparkles, Plus } from 'lucide-react';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';
import { adminLogService } from '../../services/adminLogService';
import { couponService } from '../../services/couponService';
import ProductCouponSection from '../../components/Admin/ProductCouponSection';

const AdminAddProductPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedCouponIds, setSelectedCouponIds] = useState([]);


  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('');
  const [offerId, setOfferId] = useState('');
  const [sku, setSku] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [sizes, setSizes] = useState([]);
  const [availableSizes, setAvailableSizes] = useState(['XS', 'S', 'M', 'L', 'XL']);
  const [isBestSeller, setIsBestSeller] = useState(false);

  const handleSizeToggle = (size) => {
    setSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleAddNewSize = () => {
    const newSize = window.prompt('Enter new size option (e.g. XXL, 7, Free Size):');
    if (newSize && newSize.trim()) {
      const trimmed = newSize.trim();
      if (!availableSizes.includes(trimmed)) {
        setAvailableSizes(prev => [...prev, trimmed]);
      }
      setSizes(prev => [...prev, trimmed]);
    }
  };

  // Auto-generate sequential SKU on page mount
  useEffect(() => {
    const fetchNextSku = async () => {
      try {
        const { data: existingProducts } = await supabase
          .from('products')
          .select('sku');
        
        let maxSku = 0;
        if (existingProducts && existingProducts.length > 0) {
          existingProducts.forEach(p => {
            const skuNum = parseInt(p.sku, 10);
            if (!isNaN(skuNum) && skuNum > maxSku) {
              maxSku = skuNum;
            }
          });
        }
        setSku(String(maxSku + 1));
      } catch (err) {
        console.error('Error fetching SKU count:', err);
        setSku(String(Math.floor(1000 + Math.random() * 9000)));
      }
    };

    fetchNextSku();
  }, []);

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

  // Load form state from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('admin_add_product_form');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.name) setName(data.name);
        if (data.description) setDescription(data.description);
        if (data.specifications) setSpecifications(data.specifications);
        if (data.shippingPolicy) setShippingPolicy(data.shippingPolicy);
        if (data.category) setCategory(data.category);
        if (data.categoryId) setCategoryId(data.categoryId);
        if (data.originalPrice) setOriginalPrice(data.originalPrice);
        if (data.offerPrice) setOfferPrice(data.offerPrice);
        if (data.stock) setStock(data.stock);
        if (data.offerId) setOfferId(data.offerId);
        if (data.discountPercent) setDiscountPercent(data.discountPercent);
        if (data.sizes) setSizes(data.sizes);
        if (data.images) setImages(data.images);
      }
    } catch (e) {
      console.error('Error loading saved form:', e);
    }
  }, []);

  // Save form state to sessionStorage on change
  useEffect(() => {
    const data = {
      name,
      description,
      specifications,
      shippingPolicy,
      category,
      categoryId,
      originalPrice,
      offerPrice,
      stock,
      offerId,
      discountPercent,
      sizes,
      images
    };
    sessionStorage.setItem('admin_add_product_form', JSON.stringify(data));
  }, [name, description, specifications, shippingPolicy, category, categoryId, originalPrice, offerPrice, stock, offerId, discountPercent, sizes, images]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: catData, error: catErr } = await supabase.from('categories').select('*');
        if (catErr) throw catErr;
        setCategories(catData || []);

        const { data: offData, error: offErr } = await supabase.from('offers').select('*');
        if (offErr) throw offErr;
        setOffers(offData || []);
      } catch (err) {
        console.error('Error fetching categories/offers:', err);
        showToast('Error loading form configurations', 'error');
      }
    };
    fetchData();
  }, []);

  // Sync category_id and category text name when dropdown changes
  const handleCategoryChange = (e) => {
    const id = e.target.value;
    setCategoryId(id);
    const selected = categories.find((c) => c.id === id);
    setCategory(selected ? selected.name : '');
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${Math.random().toString(36).substring(2)}-slot-${index}.${fileExt}`;
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
      // Auto-generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Insert product
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          slug,
          description,
          specifications,
          shipping_policy: shippingPolicy,
          category,
          category_id: categoryId || null,
          price: Number(originalPrice), // keep original price synced for retro-compatibility
          original_price: Number(originalPrice),
          offer_price: offerPrice ? Number(offerPrice) : null,
          discount_price: offerPrice ? Number(offerPrice) : null,
          stock: Number(stock),
          offer_id: offerId || null,
          images, // exactly 3 slots
          sku,
          sizes,
          is_best_seller: isBestSeller,
        })
        .select();

      if (error) throw error;
      const createdProd = data?.[0] || null;

      if (createdProd) {
        if (selectedCouponIds.length > 0) {
          await couponService.syncProductCoupons(createdProd.id, selectedCouponIds);
        }

        await adminLogService.logAction('created_product', 'products', createdProd.id, {
          name,
          sku,
          price: originalPrice,
          offer_price: offerPrice,
          stock,
          sizes,
          category_id: categoryId
        });
      }

      sessionStorage.removeItem('admin_add_product_form');
      showToast('Product added successfully!', 'success');
      navigate('/admin/products');
    } catch (err) {
      console.error('Error inserting product:', err);
      showToast(err.message || 'Error creating product', 'error');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-extrabold tracking-tight">Add New Product</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Publish a new listing to the store catalogue.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Primary Attributes & Pricing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase text-slate-800 dark:text-slate-200">Primary Attributes</h3>
            <p className="text-slate-400 text-xs mt-0.5">Configure main product details, prices, and stock values.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Product Name"
                id="name"
                placeholder="e.g. Diamond Hoop Earrings"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="SKU (Auto-Generated)"
                  id="sku"
                  placeholder="SS-XXXX"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                  disabled={loading}
                />
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
              </div>

              <div className="flex flex-col space-y-1.5 pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Size Options (Choose available sizes)
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {availableSizes.map((sz) => {
                    const isSelected = sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSizeToggle(sz)}
                        className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#98183f] text-white border-[#98183f]'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-705 hover:border-slate-400'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleAddNewSize}
                    className="px-3 py-2 text-xs font-black rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-all flex items-center justify-center gap-1"
                  >
                    <Plus size={12} />
                    Add Size
                  </button>
                </div>
              </div>
            </div>

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

              <Input
                label="Offer Price (Promo)"
                id="offerPrice"
                type="number"
                placeholder="68000"
                value={offerPrice}
                onChange={(e) => handleOfferPriceChange(e.target.value)}
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

              <div className="flex items-center space-x-2.5 pt-2">
                <input
                  type="checkbox"
                  id="isBestSeller"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-[#ff2a85] focus:ring-[#ff2a85] dark:bg-slate-850 cursor-pointer"
                />
                <label htmlFor="isBestSeller" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer">
                  Mark as Best Seller
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Product Coupon Assignment */}
        <ProductCouponSection
          selectedCouponIds={selectedCouponIds}
          setSelectedCouponIds={setSelectedCouponIds}
          disabled={loading}
        />

        {/* Section 3: Detailed Text Information */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase text-slate-800 dark:text-slate-200">Detailed Narrative</h3>
            <p className="text-slate-400 text-xs mt-0.5">Provide customers with granular details across description, specifications, and policies.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Input
              label="Description"
              id="description"
              type="textarea"
              rows={6}
              placeholder="Detailed description of materials, sizes, and craftsmanship..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />

            <Input
              label="Specifications"
              id="specifications"
              type="textarea"
              rows={6}
              placeholder="Detailed specifications (e.g. Dimensions, Weight, Purity)..."
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              disabled={loading}
            />

            <Input
              label="Shipping & Policy"
              id="shippingPolicy"
              type="textarea"
              rows={6}
              placeholder="Shipping times, delivery details, and return/refund policies..."
              value={shippingPolicy}
              onChange={(e) => setShippingPolicy(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Image upload section (exactly 3 slots) */}
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

        {/* Form Submission */}
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
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddProductPage;
