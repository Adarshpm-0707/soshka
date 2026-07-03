import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { adminLogService } from '../../services/adminLogService';
import { ArrowLeft, Upload, Trash2, Loader2, Crown, Plus } from 'lucide-react';
import Input from '../../components/Reusable/Input';
import Button from '../../components/Reusable/Button';
import { showToast } from '../../components/Reusable/Toast';

const SuperAdminAddProductPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);

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
        })
        .select()
        .single();

      if (error) throw error;

      // Log the superadmin creation action
      if (data) {
        await adminLogService.logAction('created_product', 'products', data.id, { name, actor: 'superadmin' });
      }

      showToast('Product added successfully!', 'success');
      window.location.href = '/superadmin/products';
    } catch (err) {
      console.error('Error inserting product:', err);
      showToast(err.message || 'Error creating product', 'error');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-black tracking-tight mt-0.5">Publish New Listing</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Bypass authorization: publish a new item catalogue listing directly.
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
                  placeholder="e.g. Diamond Hoop Earrings"
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
                    SKU (Auto-Generated)
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
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Detailed Text Information */}
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
                placeholder="Detailed description of materials, sizes, and craftsmanship..."
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

        {/* Gallery upload */}
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

        {/* Submission */}
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
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SuperAdminAddProductPage;
