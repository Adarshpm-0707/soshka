import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, MoveLeft, MoveRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { productService } from "../../services/productService";
import { formatCurrency } from "../../utils/formatCurrency";



/* ─────────────────────────────────────────────────────────────────
   ShowcaseSlider — mirrors the vanilla JS animation exactly:
     • window wheel listener (gated by hover) — same as original
     • maxScroll = wrapper.offsetWidth - slider.offsetWidth
     • LERP + GSAP depth-scale RAF loop
     • Drag / touch support
───────────────────────────────────────────────────────────────── */
const ShowcaseSlider = ({ products }) => {
  const navigate      = useNavigate();
  const sliderRef     = useRef(null);   // overflow:hidden container
  const wrapperRef    = useRef(null);   // position:absolute full-width row
  const rafRef        = useRef(null);
  const isHoveredRef  = useRef(false);
  const stateRef      = useRef({ current: 0, target: 0, maxScroll: 0 });
  const dragRef       = useRef({ active: false, startX: 0, startTarget: 0 });

  useEffect(() => {
    const slider  = sliderRef.current;
    const wrapper = wrapperRef.current;
    if (!slider || !wrapper || products.length === 0) return;

    // Reset scroll position whenever product list changes
    stateRef.current.current = 0;
    stateRef.current.target  = 0;
    gsap.set(wrapper, { x: 0 });

    // ── maxScroll — matches vanilla: offsetWidth - containerWidth ──
    const calcMax = () => {
      stateRef.current.maxScroll = Math.max(
        0,
        wrapper.offsetWidth - slider.clientWidth
      );
    };
    // Measure after a paint so max-content width is settled
    const t1 = setTimeout(calcMax, 50);
    const t2 = setTimeout(calcMax, 400); // safety re-measure

    window.addEventListener("resize", calcMax);

    // ── Hover gate — only hijack scroll while mouse is inside ──
    const onEnter = () => { isHoveredRef.current = true; };
    const onLeave = () => { isHoveredRef.current = false; };
    slider.addEventListener("mouseenter", onEnter);
    slider.addEventListener("mouseleave", onLeave);

    // ── Window wheel listener — exactly like vanilla ──
    const onWheel = (e) => {
      if (!isHoveredRef.current) return;   // ignore if not hovering
      const s = stateRef.current;
      const atStart = s.target <= 0;
      const atEnd   = s.target >= s.maxScroll;
      // At the edges, let page scroll naturally
      if ((atStart && e.deltaY < 0) || (atEnd && e.deltaY > 0)) return;
      e.preventDefault();
      s.target += e.deltaY;
      s.target = Math.max(0, Math.min(s.maxScroll, s.target));
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    // ── LERP + depth-scale RAF — exactly like vanilla ──
    const lerp = (a, b, t) => a + (b - a) * t;

    const update = () => {
      const s = stateRef.current;
      s.current = lerp(s.current, s.target, 0.075);
      gsap.set(wrapper, { x: -s.current });

      wrapper.querySelectorAll(".slide-el").forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const centerPos  = (rect.left + rect.right) / 2;
        const dist       = centerPos - window.innerWidth / 2;
        let scale, offsetX;
        if (dist > 0) {
          scale   = Math.min(1.75, 1 + dist / window.innerWidth);
          offsetX = (scale - 1) * 300;
        } else {
          scale   = Math.max(0.5, 1 - Math.abs(dist) / window.innerWidth);
          offsetX = 0;
        }
        gsap.set(slide, { scale, x: offsetX });
      });

      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", calcMax);
      window.removeEventListener("wheel", onWheel);
      slider.removeEventListener("mouseenter", onEnter);
      slider.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [products]); // re-run when filtered list changes

  // ── Drag / touch ──
  const onDragStart = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    dragRef.current = { active: true, startX: x, startTarget: stateRef.current.target };
  };
  const onDragMove = (e) => {
    if (!dragRef.current.active) return;
    const x     = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = dragRef.current.startX - x;
    const s     = stateRef.current;
    s.target    = Math.max(0, Math.min(s.maxScroll, dragRef.current.startTarget + delta * 1.5));
  };
  const onDragEnd = () => { dragRef.current.active = false; };

  const nudge = (amount) => {
    const s  = stateRef.current;
    s.target = Math.max(0, Math.min(s.maxScroll, s.target + amount));
  };

  return (
    <div
      ref={sliderRef}
      className="relative w-full h-[600px] overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-3xl flex border border-slate-200 dark:border-white/5 shadow-2xl select-none"
      style={{ cursor: "grab" }}
      onMouseDown={onDragStart}
      onMouseMove={onDragMove}
      onMouseUp={onDragEnd}
      onMouseLeave={(e) => { onDragEnd(); }}
      onTouchStart={onDragStart}
      onTouchMove={onDragMove}
      onTouchEnd={onDragEnd}
    >
      {/* ── Rotated sidebar (matches vanilla .sidebar) ── */}
      <div className="hidden md:block w-[130px] shrink-0 relative border-r border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-slate-900 overflow-hidden z-10">
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "600px",
            height: "130px",
            transform: "rotate(-90deg) translate(-600px, 0)",
            transformOrigin: "left top",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "1.5em 3em",
          }}
        >
          <div style={{ flex: 2 }}>
            <p
              style={{
                textTransform: "uppercase",
                fontSize: "3.5rem",
                lineHeight: "85%",
                fontWeight: 700,
                fontFamily: "serif",
                color: "inherit",
              }}
              className="text-slate-900 dark:text-white"
            >
              Featured<span className="text-brand">.</span>
            </p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-extrabold mt-2">
              Curated handpicked essentials
            </p>
          </div>
          <div style={{ flex: 1, display: "flex", gap: "3em", textAlign: "right" }}>
            <div>
              <p className="font-mono text-xs text-slate-400">/SOSHKA</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">Scroll Experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slider area — position:relative so wrapper can be absolute ── */}
      <div className="flex-1 h-full overflow-hidden relative">

        {/* Top label */}
        <div className="absolute top-6 left-8 z-20 pointer-events-none">
          <p className="text-[10px] uppercase tracking-[0.25em] text-brand font-extrabold mb-1">Featured Showcase</p>
          <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">Curated Picks</h3>
        </div>

        {/* Wrapper — position:absolute, width:max-content (matches vanilla) */}
        <div
          ref={wrapperRef}
          className="absolute top-0 left-0 h-full flex items-center gap-24 px-[250px]"
          style={{ width: "max-content" }}
        >
          {products.map((product) => {
            const hasDiscount = product.discount_price && product.discount_price < product.price;
            return (
              <div
                key={product.id}
                className="slide-el w-[240px] h-[330px] shrink-0 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 shadow-md relative group hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-shadow duration-300"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <img
                  src={product.images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"}
                  alt={product.name}
                  loading="lazy"
                  draggable={false}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent flex flex-col justify-end p-5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] uppercase tracking-wider text-slate-300 font-extrabold mb-1">
                    {product.category}
                  </span>
                  <h4 className="text-base font-extrabold text-white leading-tight truncate pointer-events-none">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10">
                    <span className="text-sm font-black text-slate-200">
                      {formatCurrency(hasDiscount ? product.discount_price : product.price)}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-white bg-brand px-2.5 py-1 rounded-full flex items-center gap-1">
                      Explore <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow controls */}
        <div className="absolute bottom-6 right-8 flex items-center gap-2 z-20">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => nudge(-400)}
            className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white transition-all hover:scale-105"
          >
            <MoveLeft size={16} />
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => nudge(400)}
            className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white transition-all hover:scale-105"
          >
            <MoveRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton ── */
const SliderSkeleton = () => (
  <div className="w-full h-[600px] bg-slate-100 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/5 flex overflow-hidden animate-pulse">
    <div className="hidden md:block w-[130px] border-r border-slate-200 dark:border-white/5" />
    <div className="flex-1 flex items-center justify-center gap-24 px-[250px] overflow-hidden">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-[240px] h-[330px] shrink-0 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main featured section
───────────────────────────────────────────── */
const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const sectionRef = useRef(null);
  const isInView   = useInView(sectionRef, { once: true, margin: "-80px" });

  useEffect(() => {
    productService.getFeaturedProducts(12)
      .then((data) => setProducts(data))
      .catch((err) => setError(err.message || "Error"))
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
          <ShowcaseSlider products={products} />
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
