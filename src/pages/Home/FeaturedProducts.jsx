import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ArrowRight, ShoppingCart, Heart, Star, Sparkles } from "lucide-react";
import { productService } from "../../services/productService";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../hooks/useWishlist";
import { formatCurrency } from "../../utils/formatCurrency";
import { showToast } from "../../components/Reusable/Toast";
import { SkeletonGrid } from "../../components/Reusable/Loader";

const TABS = [
  { id: "all", name: "All", emoji: "✦" },
  { id: "rings", name: "Rings", emoji: "💍" },
  { id: "necklaces", name: "Necklaces", emoji: "📿" },
  { id: "earrings", name: "Earrings", emoji: "✨" },
  { id: "bracelets", name: "Bracelets", emoji: "⬡" },
  { id: "chains", name: "Chains", emoji: "⛓" },
];

/* ── Inline Product Card for this section ── */
const FeaturedCard = ({ product, variant = "default" }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isFav = isInWishlist(product.id);
  const hasDiscount =
    product.discount_price && product.discount_price < product.price;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isFav) {
        await removeFromWishlist(product.id);
        showToast("Removed from wishlist", "info");
      } else {
        await addToWishlist(product);
        showToast("Added to wishlist", "success");
      }
    } catch (err) {
      showToast(err.message || "Error", "error");
    }
  };

  const handleCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      showToast("Added to cart", "success");
    } catch (err) {
      showToast(err.message || "Error", "error");
    }
  };

  if (variant === "hero") {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative group overflow-hidden rounded-3xl"
        style={{ aspectRatio: "3/4" }}
      >
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          {/* Image */}
          <img
            src={
              product.images?.[0] ||
              "https://images.unsplash.com/photo-1600721391776-b5cd0e0048f9?w=800&auto=format&fit=crop&q=80"
            }
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Floating badges */}
          <div className="absolute top-5 left-5 flex gap-2">
            {hasDiscount && (
              <span className="px-3 py-1.5 bg-[#ff2a85] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                Sale
              </span>
            )}
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20">
              {product.category}
            </span>
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-[#ff2a85] hover:border-[#ff2a85] transition-all duration-300"
          >
            <Heart
              size={16}
              fill={isFav ? "#ff2a85" : "none"}
              className={isFav ? "text-[#ff2a85]" : "text-white"}
            />
          </button>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Star size={12} className="text-amber-400" fill="currentColor" />
              <span className="text-white text-xs font-bold">
                {product.rating || "5.0"}
              </span>
              <span className="text-white/50 text-[10px]">
                ({product.review_count || 0})
              </span>
            </div>
            <h3
              className="text-white text-2xl font-bold leading-tight"
              style={{ fontFamily: "'TT Drugs', sans-serif" }}
            >
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <div>
                {hasDiscount ? (
                  <>
                    <span className="text-white/50 text-xs line-through mr-2">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-white text-xl font-extrabold">
                      {formatCurrency(product.discount_price)}
                    </span>
                  </>
                ) : (
                  <span className="text-white text-xl font-extrabold">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
              <button
                onClick={handleCart}
                disabled={product.stock === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-black text-xs font-extrabold uppercase tracking-wide hover:bg-[#ff2a85] hover:text-white transition-all duration-300 disabled:opacity-50"
              >
                <ShoppingCart size={13} />
                Add
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Default tall card
  if (variant === "tall") {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative group overflow-hidden rounded-2xl bg-slate-100 dark:bg-[#0c0c0d] border border-slate-200/50 dark:border-[#1c1c1e]"
        style={{ aspectRatio: "2/3" }}
      >
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          <img
            src={
              product.images?.[0] ||
              "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop&q=80"
            }
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Overlay content on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <p className="text-[10px] text-[#ff2a85] font-extrabold uppercase tracking-widest mb-1">
              {product.category}
            </p>
            <h3 className="text-white font-bold text-sm leading-tight mb-2">
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-white font-extrabold text-base">
                {formatCurrency(
                  hasDiscount ? product.discount_price : product.price,
                )}
              </span>
              <button
                onClick={handleCart}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-md hover:bg-[#ff2a85] transition-all duration-300"
              >
                <ShoppingCart size={14} className="text-white" />
              </button>
            </div>
          </div>

          {hasDiscount && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-[#ff2a85] text-white text-[9px] font-black uppercase rounded-full tracking-wider">
              Sale
            </span>
          )}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-[#ff2a85] transition-all duration-300"
          >
            <Heart
              size={12}
              fill={isFav ? "#ff2a85" : "none"}
              className={isFav ? "text-[#ff2a85]" : "text-white"}
            />
          </button>

          {/* Static label (before hover) */}
          <div className="absolute bottom-3 left-3 right-3 group-hover:opacity-0 transition-opacity duration-300">
            <p className="text-[9px] text-white/60 font-bold uppercase tracking-widest">
              {product.category}
            </p>
            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-1">
              {product.name}
            </h3>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Compact horizontal card
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.3 }}
      className="group flex gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0c0c0d] border border-slate-200/60 dark:border-[#1c1c1e] hover:border-[#98183f] dark:hover:border-[#ff2a85] transition-all duration-300"
    >
      <Link to={`/products/${product.id}`} className="flex gap-4 w-full">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
          <img
            src={
              product.images?.[0] ||
              "https://images.unsplash.com/photo-1612118899877-5cf9c88b3b30?w=200&auto=format&fit=crop&q=80"
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <p className="text-[9px] text-[#98183f] dark:text-[#ff2a85] font-extrabold uppercase tracking-widest">
            {product.category}
          </p>
          <h4 className="text-slate-900 dark:text-white text-sm font-semibold leading-tight line-clamp-1">
            {product.name}
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-slate-900 dark:text-white text-sm font-extrabold">
              {formatCurrency(
                hasDiscount ? product.discount_price : product.price,
              )}
            </span>
            <button
              onClick={handleCart}
              className="p-1.5 rounded-lg bg-[#98183f] dark:bg-[#ff2a85] hover:opacity-80 transition-opacity"
            >
              <ShoppingCart size={12} className="text-white" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ── Main Section ── */
const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await productService.getFeaturedProducts(12);
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        setError(err.message || "Error fetching featured products");
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (activeTab === "all") setFilteredProducts(products);
    else setFilteredProducts(products.filter((p) => p.category === activeTab));
  }, [activeTab, products]);

  if (error)
    return (
      <div className="py-12 text-center text-red-500 font-semibold text-sm">
        {error}
      </div>
    );

  const heroProduct = filteredProducts[0];
  const tallProducts = filteredProducts.slice(1, 4);
  const compactProducts = filteredProducts.slice(4, 8);

  return (
    <section
      ref={sectionRef}
      className="py-20 border-t border-slate-200/40 dark:border-[#1c1c1e] transition-colors duration-300"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#ff2a85]" />
              <span className="text-[11px] text-[#ff2a85] font-extrabold uppercase tracking-[0.2em]">
                Curated For You
              </span>
            </div>
            <h2
              className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-none tracking-tight"
              style={{ fontFamily: "'TT Drugs', sans-serif" }}
            >
              Featured
            </h2>
            <h2
              className="text-4xl sm:text-5xl font-bold leading-none tracking-tight"
              style={{ fontFamily: "'TT Drugs', sans-serif" }}
            >
              Products
            </h2>
            <style>{`.dark { --featured-stroke: #444 } :root { --featured-stroke: #ccc }`}</style>
          </div>

          {/* View all link */}
          <Link
            to="/products"
            className="group flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#98183f] dark:hover:text-[#ff2a85] transition-colors"
          >
            View All
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </motion.div>

        {/* ── Filter Pills ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-wrap gap-2.5 mb-12"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest transition-all duration-300 ${
                  isActive
                    ? "text-white bg-[#98183f] dark:bg-[#ff2a85] shadow-lg shadow-[#98183f]/20 dark:shadow-[#ff2a85]/20"
                    : "text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-[#0c0c0d] border border-slate-200 dark:border-[#1c1c1e] hover:border-[#98183f] dark:hover:border-[#ff2a85] hover:text-[#98183f] dark:hover:text-[#ff2a85]"
                }`}
              >
                <span className="mr-1.5">{tab.emoji}</span>
                {tab.name}
              </button>
            );
          })}
        </motion.div>

        {/* ── Grid Layout ── */}
        {loading ? (
          <SkeletonGrid count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No featured products available.
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5"
            >
              {/* Hero Product — large left */}
              {heroProduct && (
                <motion.div
                  className="lg:col-span-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <FeaturedCard product={heroProduct} variant="hero" />
                </motion.div>
              )}

              {/* Middle: 3 tall cards */}
              <div className="lg:col-span-5 grid grid-cols-3 gap-4 lg:gap-5">
                {tallProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
                  >
                    <FeaturedCard product={product} variant="tall" />
                  </motion.div>
                ))}
              </div>

              {/* Right: compact list */}
              <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
                {/* Label */}
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-1">
                  Quick Picks
                </p>
                {compactProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                  >
                    <FeaturedCard product={product} variant="compact" />
                  </motion.div>
                ))}

                {/* CTA Banner */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-auto rounded-2xl overflow-hidden relative"
                  style={{ minHeight: "90px" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#98183f] to-[#6b1030] dark:from-[#ff2a85] dark:to-[#c41f66]" />
                  <div className="relative p-4 flex flex-col gap-2">
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">
                      Explore More
                    </p>
                    <p className="text-white text-sm font-bold leading-tight">
                      Discover the full collection
                    </p>
                    <Link
                      to="/products"
                      className="self-start flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-xl bg-white text-[#98183f] dark:text-[#c41f66] text-[10px] font-extrabold uppercase tracking-wider hover:bg-black hover:text-white transition-all duration-300"
                    >
                      Shop All <ArrowRight size={10} />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
