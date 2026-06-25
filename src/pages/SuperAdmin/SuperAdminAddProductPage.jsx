import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { adminLogService } from '../../services/adminLogService';
import { ArrowLeft, Upload, Trash2, Loader2, Crown } from 'lucide-react';
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
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('');
  const [cost, setCost] = useState('');
  const [offerId, setOfferId] = useState('');

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
          category,
          category_id: categoryId || null,
          price: Number(originalPrice),
          original_price: Number(originalPrice),
          offer_price: offerPrice ? Number(offerPrice) : null,
          stock: Number(stock),
          cost: cost ? Number(cost) : 0,
          offer_id: offerId || null,
          images, // exactly 3 slots
        })
        .select()
        .single();

      if (error) throw error;

      // Log the superadmin creation action
      if (data) {
        await adminLogService.logAction('created_product', 'products', data.id, { name, actor: 'superadmin' });
      }

      showToast('Product added successfully!', 'success');
      navigate('/superadmin/products');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0c0c0d] border border-[#1c1c1e] rounded-3xl p-6 shadow-sm">
          
          {/* Left Column Fields */}
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

            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Detailed description of materials, sizes, and craftsmanship..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655 resize-none"
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
          </div>

          {/* Right Column Fields */}
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
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
                />
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
                  onChange={(e) => setOfferPrice(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-[#26262a] focus:border-[#ff2a85] text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-655"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
