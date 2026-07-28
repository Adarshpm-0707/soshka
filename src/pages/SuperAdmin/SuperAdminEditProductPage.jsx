import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { adminLogService } from '../../services/adminLogService';
import { ArrowLeft, Upload, Trash2, Loader2, Crown, Plus } from 'lucide-react';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';
import { couponService } from '../../services/couponService';
import ProductCouponSection from '../../components/Admin/ProductCouponSection';

const SuperAdminEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
  const [cost, setCost] = useState('');
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
          setSpecifications(prodData.specifications || '');
          setShippingPolicy(prodData.shipping_policy || '');
          setCategory(prodData.category || '');
          setCategoryId(prodData.category_id || '');
          const orig = prodData.original_price ?? prodData.price ?? '';
          const offer = prodData.offer_price ?? '';
          setOriginalPrice(orig);
          setOfferPrice(offer);
          setStock(prodData.stock ?? '');
          setCost(prodData.cost ?? '');
          setOfferId(prodData.offer_id || '');
          setSku(prodData.sku ?? '');
          const loadedSizes = prodData.sizes || [];
          setSizes(loadedSizes);
          setSelectedCouponIds(prodData.applicable_coupon_ids || []);
          setIsBestSeller(prodData.is_best_seller || false);
          setAvailableSizes(prev => {
            const merged = [...prev];
            loadedSizes.forEach(s => {
              if (!merged.includes(s)) merged.push(s);
            });
            return merged;
          });

          if (orig && offer) {
            const calculatedPercent = Math.round(((Number(orig) - Number(offer)) / Number(orig)) * 100);
            setDiscountPercent(calculatedPercent.toString());
          } else {
            setDiscountPercent('');
          }
          
          // Ensure exactly 3 slots
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
          specifications,
          shipping_policy: shippingPolicy,
          category,
          category_id: categoryId || null,
          price: Number(originalPrice),
          original_price: Number(originalPrice),
          offer_price: offerPrice ? Number(offerPrice) : null,
          discount_price: offerPrice ? Number(offerPrice) : null,
          stock: Number(stock),
          cost: cost ? Number(cost) : 0,
          offer_id: offerId || null,
          images, // exactly 3 slots
          sku,
          sizes,
          is_best_seller: isBestSeller,
        })
        .eq('id', id);

      if (error) throw error;

      await couponService.syncProductCoupons(id, selectedCouponIds);

      // Log the superadmin edit action
      await adminLogService.logAction('updated_product', 'products', id, {
        name,
        sku,
        price: originalPrice,
        offer_price: offerPrice,
        stock,
        sizes,
        category_id: categoryId,
        actor: 'superadmin'
      });

      showToast('Product updated successfully!', 'success');
      navigate('/superadmin/products');
    } catch (err) {
      console.error('Error updating product:', err);
      showToast(err.message || 'Error updating product', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8 mb-2" />
        <p className="text-sm font-semibold">Loading product parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/superadmin/products"
          className="p-2.5 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#ff2a85] uppercase tracking-widest">
            <Crown size={12} /> Super Admin Console
          </div>
          <h1 className="text-3xl font-black tracking-tight mt-0.5">Edit Product</h1>
          <p className="text-slate-450 text-xs mt-0.5">
            Modify details for catalogue listing: <span className="font-extrabold text-[#ff2a85]">{name}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Primary Attributes & Pricing */}
        <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">Primary Attributes</h3>
            <p className="text-slate-400 text-xs mt-0.5">Configure main product details, prices, and stock values.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Product Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={handleCategoryChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-[#26262a] focus:border-[#ff2a85] text-sm bg-slate-950 outline-none text-slate-300"
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
                <div className="space-y-1.5">
                  <label htmlFor="sku" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    SKU
                  </label>
                  <input
                    id="sku"
                    type="text"
                    placeholder="SS-XXXX"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="stock" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Stock Quantity *
                  </label>
                  <input
                    id="stock"
                    type="number"
                    placeholder="10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
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
                        className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#ff2a85] text-white border-[#ff2a85] shadow-lg shadow-pink-500/25'
                            : 'bg-slate-950 text-slate-400 border-[#26262a] hover:border-slate-700'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleAddNewSize}
                    className="px-3.5 py-2.5 text-xs font-black rounded-xl border border-dashed border-[#26262a] text-slate-400 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-1.5 bg-slate-950"
                  >
                    <Plus size={12} />
                    Add Size
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="originalPrice" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Original Price *
                  </label>
                  <input
                    id="originalPrice"
                    type="number"
                    placeholder="75000"
                    value={originalPrice}
                    onChange={(e) => handleOriginalPriceChange(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="discountPercent" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Discount (%)
                  </label>
                  <input
                    id="discountPercent"
                    type="number"
                    placeholder="10"
                    value={discountPercent}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="offerPrice" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Offer Price (Promo)
                </label>
                <input
                  id="offerPrice"
                  type="number"
                  placeholder="68000"
                  value={offerPrice}
                  onChange={(e) => handleOfferPriceChange(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="cost" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Product Cost *
                  </label>
                  <input
                    id="cost"
                    type="number"
                    placeholder="e.g. 5000"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Link active campaign
                  </label>
                  <select
                    value={offerId}
                    onChange={(e) => setOfferId(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-[#26262a] focus:border-[#ff2a85] text-sm bg-slate-950 outline-none text-slate-300"
                  >
                    <option value="">-- Select Offer (Optional) --</option>
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
                    className="h-4 w-4 rounded border-[#26262a] text-[#ff2a85] focus:ring-[#ff2a85] bg-slate-950 cursor-pointer"
                  />
                  <label htmlFor="isBestSeller" className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 cursor-pointer">
                    Mark as Best Seller
                  </label>
                </div>
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
        <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">Detailed Narrative</h3>
            <p className="text-slate-400 text-xs mt-0.5">Provide customers with granular details across description, specifications, and policies.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Description
              </label>
              <textarea
                id="description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="specifications" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Specifications
              </label>
              <textarea
                id="specifications"
                rows={6}
                placeholder="Detailed specifications (e.g. Dimensions, Weight, Purity)..."
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="shippingPolicy" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Shipping & Policy
              </label>
              <textarea
                id="shippingPolicy"
                rows={6}
                placeholder="Shipping times, delivery details, and return/refund policies..."
                value={shippingPolicy}
                onChange={(e) => setShippingPolicy(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase">Product Gallery</h3>
            <p className="text-slate-400 text-xs mt-0.5">Please provide exactly 3 product image assets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {images.map((imgUrl, index) => (
              <div key={index} className="flex flex-col items-center space-y-3 p-4 bg-slate-950 border border-[#1c1c1e] rounded-2xl relative overflow-hidden">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Image {index + 1}</span>
                
                {imgUrl ? (
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-[#1c1c1e] bg-slate-950">
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
                  <label className="w-full aspect-square border-2 border-dashed border-[#26262a] hover:border-[#ff2a85] rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-slate-950 group">
                    {uploadingIndex === index ? (
                      <Loader2 className="animate-spin text-[#ff2a85] h-8 w-8" />
                    ) : (
                      <>
                        <Upload size={22} className="text-slate-500 group-hover:text-[#ff2a85] transition-colors" />
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide mt-2">Upload asset</span>
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
          <Link
            to="/superadmin/products"
            className="px-6 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/5 text-slate-300 font-semibold text-sm transition"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            className="px-6 font-bold text-sm bg-gradient-to-r from-[#ff2a85] to-purple-650 hover:opacity-95 border-none transition duration-200"
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

export default SuperAdminEditProductPage;
