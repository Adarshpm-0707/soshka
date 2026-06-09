import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MoveLeft, MoveRight, ShoppingBag, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/formatCurrency';

const ProductShowcaseSlider = () => {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const wrapperRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured products for showcase
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await productService.getFeaturedProducts(7);
        setProducts(data);
      } catch (err) {
        console.error('Error fetching featured showcase products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Use refs to keep values mutable in the animation loop
  const stateRef = useRef({ current: 0, target: 0, maxScroll: 0 });

  useEffect(() => {
    const slider = sliderRef.current;
    const wrapper = wrapperRef.current;
    if (!slider || !wrapper || products.length === 0) return;

    const handleResize = () => {
      // Calculate max scroll boundary
      stateRef.current.maxScroll = Math.max(0, wrapper.scrollWidth - slider.offsetWidth);
    };

    // Recalculate size after render
    const timer = setTimeout(() => {
      handleResize();
    }, 300);

    window.addEventListener('resize', handleResize);

    // Wheel event handler
    const handleWheel = (e) => {
      const state = stateRef.current;
      const delta = e.deltaY;

      // Allow vertical scroll if at limits
      const isScrollingLeft = delta < 0;
      const isScrollingRight = delta > 0;
      const atStart = state.target <= 0;
      const atEnd = state.target >= state.maxScroll;

      if ((atStart && isScrollingLeft) || (atEnd && isScrollingRight)) {
        return; // Don't prevent default vertical page scrolling
      }

      e.preventDefault();
      let newTarget = state.target + delta * 0.85; // slightly scaled down sensitivity
      newTarget = Math.max(0, Math.min(state.maxScroll, newTarget));
      state.target = newTarget;
    };

    slider.addEventListener('wheel', handleWheel, { passive: false });

    // Lerp animation loop
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const update = () => {
      const state = stateRef.current;
      state.current = lerp(state.current, state.target, 0.075);

      // Apply horizontal position
      gsap.set(wrapper, { x: -state.current });

      // Apply dynamic scale and offset based on center position
      const slides = wrapper.querySelectorAll('.slide-element');
      const sliderRect = slider.getBoundingClientRect();
      const sliderCenter = sliderRect.left + sliderRect.width / 2;

      slides.forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const centerPosition = (rect.left + rect.right) / 2;
        const distanceFromCenter = centerPosition - window.innerWidth / 2;

        let scale, offsetX;
        if (distanceFromCenter > 0) {
          scale = Math.min(1.75, 1 + distanceFromCenter / window.innerWidth);
          offsetX = (scale - 1) * 300;
        } else {
          scale = Math.max(0.5, 1 - Math.abs(distanceFromCenter) / window.innerWidth);
          offsetX = 0;
        }

        gsap.set(slide, { scale: scale, x: offsetX });
      });

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (slider) slider.removeEventListener('wheel', handleWheel);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [products]);

  // Touch and Drag Scroll Support
  const touchRef = useRef({ startX: 0, startTarget: 0, isDragging: false });

  const handleDragStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    touchRef.current.startX = clientX;
    touchRef.current.startTarget = stateRef.current.target;
    touchRef.current.isDragging = true;
  };

  const handleDragMove = (e) => {
    if (!touchRef.current.isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - touchRef.current.startX;
    let newTarget = touchRef.current.startTarget - deltaX * 1.5;
    newTarget = Math.max(0, Math.min(stateRef.current.maxScroll, newTarget));
    stateRef.current.target = newTarget;
  };

  const handleDragEnd = () => {
    touchRef.current.isDragging = false;
  };

  const scrollBy = (amount) => {
    const state = stateRef.current;
    let newTarget = state.target + amount;
    newTarget = Math.max(0, Math.min(state.maxScroll, newTarget));
    state.target = newTarget;
  };

  if (loading) {
    return (
      <div className="w-full h-[620px] bg-transparent dark:bg-transparent border border-slate-200 dark:border-slate-900 rounded-3xl mb-12 flex animate-pulse select-none">
        <div className="hidden md:block w-[130px] shrink-0 border-r border-slate-200 dark:border-slate-900 bg-slate-200/30 dark:bg-slate-900/30" />
        <div className="flex-1 h-full flex items-center justify-center gap-12 md:gap-16 overflow-hidden px-8">
          <div className="w-[200px] h-[280px] md:w-[240px] md:h-[330px] rounded-2xl bg-slate-200/40 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/30 shrink-0" />
          <div className="w-[200px] h-[280px] md:w-[240px] md:h-[330px] rounded-2xl bg-slate-200/40 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/30 shrink-0 scale-105" />
          <div className="w-[200px] h-[280px] md:w-[240px] md:h-[330px] rounded-2xl bg-slate-200/40 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/30 shrink-0" />
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[620px] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white rounded-3xl mb-12 flex border border-slate-200 dark:border-white/5 shadow-2xl select-none"
      ref={sliderRef}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* ── Left Sidebar (Rotated Text Style) ── */}
      <div className="hidden md:block w-[130px] shrink-0 relative border-r border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-slate-900 overflow-hidden">
        <div 
          className="absolute top-0 left-0 flex items-center justify-between px-8"
          style={{
            width: '620px',
            height: '130px',
            transform: 'rotate(-90deg) translate(-620px, 0)',
            transformOrigin: 'left top',
          }}
        >
          <div className="flex-grow">
            <p className="text-[3.5rem] font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none" style={{ fontFamily: 'serif' }}>
              Featured Showcase<span className="text-brand">.</span>
            </p>
        
          </div>
          <div className="flex shrink-0 items-center gap-8 text-right pr-6">
            <div>
              <p className="font-mono text-xs text-slate-400 dark:text-slate-550">/I2IVU98</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mt-0.5">Scroll Catalog</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Slider Container ── */}
      <div className="flex-1 h-full overflow-hidden relative cursor-grab active:cursor-grabbing">
        {/* Helper overlay */}
        <div className="absolute top-6 left-8 z-15 pointer-events-none">
          <p className="text-[10px] uppercase tracking-[0.25em] text-brand font-extrabold mb-1">Featured Showcase</p>
          <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">Curated Picks</h3>
        </div>

        {/* Scroll wrapper */}
        <div 
          className="flex items-center h-full gap-16 px-[180px] md:px-[280px]"
          ref={wrapperRef}
          style={{ width: 'max-content' }}
        >
          {products.map((product) => {
            const hasDiscount = product.discount_price && product.discount_price < product.price;
            return (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="slide-element w-full max-w-[200px] h-[280px] md:w-[240px] md:h-[330px] shrink-0 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 shadow-md relative group transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] cursor-pointer"
              >
                {/* Background Image */}
                <img 
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'} 
                  alt={product.name} 
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] uppercase tracking-wider text-slate-300 font-extrabold mb-1">{product.category}</span>
                  <h4 className="text-base font-extrabold text-white leading-tight truncate pointer-events-none">{product.name}</h4>
                  
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10">
                    <span className="text-sm font-black text-slate-200">
                      {formatCurrency(hasDiscount ? product.discount_price : product.price)}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-white bg-brand px-2.5 py-1 rounded-full flex items-center gap-1 transition-transform group-hover:scale-105">
                      Explore <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Slide Controls ── */}
        <div className="absolute bottom-6 right-8 flex items-center gap-2 z-20">
          <button 
            onClick={() => scrollBy(-360)}
            className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300/80 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white transition-all hover:scale-105"
            title="Scroll Left"
          >
            <MoveLeft size={16} />
          </button>
          <button 
            onClick={() => scrollBy(360)}
            className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300/80 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white transition-all hover:scale-105"
            title="Scroll Right"
          >
            <MoveRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductShowcaseSlider);
