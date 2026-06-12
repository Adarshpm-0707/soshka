import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, MoveLeft, MoveRight, Sparkles } from "lucide-react";
import { productService } from "../../services/productService";
import ProductCard from "../../components/Reusable/ProductCard";

const CardSlider = ({ products }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollLimits = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    checkScrollLimits();
    container.addEventListener('scroll', checkScrollLimits);
    window.addEventListener('resize', checkScrollLimits);

    return () => {
      container.removeEventListener('scroll', checkScrollLimits);
      window.removeEventListener('resize', checkScrollLimits);
    };
  }, [products]);

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.75;
    const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative group/slider w-full">
      {/* Left Arrow Button */}
      {showLeftArrow && (
        <button
          onClick={() => handleScroll('left')}
          className="hidden md:flex absolute -left-4 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/95 dark:bg-slate-905/95 text-slate-800 dark:text-white border border-slate-200/50 dark:border-slate-800/80 shadow-lg items-center justify-center hover:scale-110 hover:bg-[#ff2a85] dark:hover:bg-[#ff2a85] hover:text-white dark:hover:text-white active:scale-95 transition-all duration-300 backdrop-blur-sm"
          aria-label="Previous Slide"
        >
          <MoveLeft size={18} />
        </button>
      )}

      {/* Right Arrow Button */}
      {showRightArrow && (
        <button
          onClick={() => handleScroll('right')}
          className="hidden md:flex absolute -right-4 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/95 dark:bg-slate-905/95 text-slate-800 dark:text-white border border-slate-200/50 dark:border-slate-800/80 shadow-lg items-center justify-center hover:scale-110 hover:bg-[#ff2a85] dark:hover:bg-[#ff2a85] hover:text-white dark:hover:text-white active:scale-95 transition-all duration-300 backdrop-blur-sm"
          aria-label="Next Slide"
        >
          <MoveRight size={18} />
        </button>
      )}

      {/* Scrollable Container (Desktop/Tablet) */}
      <div
        ref={scrollContainerRef}
        className="hidden md:flex w-full gap-6 overflow-x-auto scroll-smooth scrollbar-none py-4 px-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[320px] shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Grid Container (Mobile View - 2 columns) */}
      <div className="grid grid-cols-2 gap-4 md:hidden py-4 px-1">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

/* ── Skeleton ── */
const SliderSkeleton = () => (
  <>
    {/* Desktop Skeleton */}
    <div className="hidden md:flex w-full gap-6 overflow-x-auto py-4 px-2 scrollbar-none animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="w-[320px] h-[450px] shrink-0 rounded-2xl bg-slate-200 dark:bg-slate-850" />
      ))}
    </div>
    {/* Mobile Skeleton */}
    <div className="grid grid-cols-2 gap-4 md:hidden py-4 px-1 animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-200 dark:bg-slate-850" />
      ))}
    </div>
  </>
);

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  useEffect(() => {
    productService.getFeaturedProducts(12)
      .then((data) => setProducts(data))
      .catch((err) => setError(err.message || "Error fetching products"))
      .finally(() => setLoading(false));
  }, []);

  if (error)
    return <div className="py-12 text-center text-red-500 font-semibold text-sm">{error}</div>;

  return (
    <section
      ref={sectionRef}
      className="py-20 border-t border-slate-200/40 dark:border-[#1c1c1e] transition-colors duration-300"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10"
        >
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
          </div>
          <Link
            to="/products"
            className="group flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#98183f] dark:hover:text-[#ff2a85] transition-colors"
          >
            View All
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Slider */}
        {loading ? (
          <SliderSkeleton />
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No featured products available.
          </div>
        ) : (
          <CardSlider products={products} />
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
