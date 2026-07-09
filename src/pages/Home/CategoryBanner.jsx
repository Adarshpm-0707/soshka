import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import SectionTitle from '../../components/Reusable/SectionTitle';

const CategoryBanner = () => {
  const containerRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [categoryImagesMap, setCategoryImagesMap] = useState({});

  useEffect(() => {
    const fetchCategoriesAndImages = async () => {
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        if (catError) throw catError;

        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('category, category_id, images');
        if (prodError) throw prodError;

        const imgMap = {};
        if (prodData) {
          prodData.forEach(p => {
            const key = p.category_id || p.category;
            if (key && p.images && p.images.length > 0) {
              if (!imgMap[key]) {
                imgMap[key] = [];
              }
              p.images.forEach(img => {
                if (img && img.trim()) {
                  imgMap[key].push(img);
                }
              });
            }
          });
        }

        setCategoryImagesMap(imgMap);
        setCategories(catData || []);
      } catch (err) {
        console.error('Error fetching categories for banner:', err);
      }
    };
    fetchCategoriesAndImages();
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;

    let active = true;
    let tweens = [];

    // Dynamically load GSAP and ScrollTrigger to optimize page performance
    Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger')
    ]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      if (!active) return;
      
      gsap.registerPlugin(ScrollTrigger);

      const container = containerRef.current;
      if (!container) return;

      const containers = container.querySelectorAll('.category-marquee-container');

      containers.forEach((item, index) => {
        const marquee = item.querySelector('.category-marquee');
        const title = marquee.querySelector('.item-title');
        
        const isEven = index % 2 === 0;
        const startX = isEven ? '0%' : '-15%';
        const endX = isEven ? '12%' : '-27%';

        // 1. Horizontal scroll slide animation matching index parity directions
        const marqueeTween = gsap.fromTo(
          marquee,
          { x: startX },
          {
            x: endX,
            ease: 'none',
            scrollTrigger: {
              trigger: item,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
        tweens.push(marqueeTween);

        // 2. Character font-weight animation on scroll
        if (title) {
          const chars = title.querySelectorAll('.category-char');
          const reverse = !isEven;
          const staggerOptions = {
            each: 0.35,
            from: reverse ? 'start' : 'end',
            ease: 'linear',
          };

          const charTween = gsap.fromTo(
            chars,
            { fontWeight: 100 },
            {
              fontWeight: 900,
              ease: 'none',
              stagger: staggerOptions,
              scrollTrigger: {
                trigger: item,
                start: '50% bottom',
                end: 'top top',
                scrub: true,
              },
            }
          );
          tweens.push(charTween);
        }
      });
    });

    return () => {
      active = false;
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    };
  }, [categories, categoryImagesMap]);

  return (
    <section ref={containerRef} className="py-20 bg-slate-50 dark:bg-slate-950 border-y border-slate-200/40 dark:border-slate-900 transition-colors duration-300 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
        {/* Section Title */}
        <SectionTitle
          title="Browse By Category"
          subtitle="Explore our comprehensive collection categorised logically for easier shopping experience."
        />
      </div>

      {/* Marquees Container */}
      <div className="marquees-section flex flex-col gap-4">
        {categories.map((cat, index) => {
          const list = categoryImagesMap[cat.id] || categoryImagesMap[cat.name] || [];
          if (list.length === 0) return null; // Hide category if there are no admin-added images

          const catImages = [];
          while (catImages.length < 4) {
            catImages.push(...list);
          }
          const finalImages = catImages.slice(0, 4);
          
          return (
            <div 
              key={cat.id} 
              className="category-marquee-container" 
              id={`marquee-${index + 1}`}
              style={{ left: index % 2 === 0 ? '-15%' : '0%' }}
            >
              <div className="category-marquee flex gap-6 items-center">
                {/* Item 1: Image */}
                <div className="category-marquee-item w-72 sm:w-80 lg:w-96 h-full flex-shrink-0">
                  <img src={finalImages[0]} alt={cat.name} loading="lazy" />
                </div>
                
                {/* Item 2: Text Title (Double-width column) */}
                <div className="category-marquee-item with-text w-56 sm:w-[28rem] lg:w-[32rem] h-full flex-shrink-0">
                  <Link to={`/products?category=${cat.name}`} className="block">
                    <span className="item-title select-none block">
                      {cat.name.split('').map((char, charIdx) => (
                        <span key={charIdx} className="category-char inline-block" style={{ fontWeight: 100 }}>
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))}
                    </span>
                  </Link>
                </div>
                
                {/* Item 3: Image */}
                <div className="category-marquee-item w-72 sm:w-80 lg:w-96 h-full flex-shrink-0">
                  <img src={finalImages[1]} alt={cat.name} loading="lazy" />
                </div>
                
                {/* Item 4: Image */}
                <div className="category-marquee-item w-72 sm:w-80 lg:w-96 h-full flex-shrink-0">
                  <img src={finalImages[2]} alt={cat.name} loading="lazy" />
                </div>
                
                {/* Item 5: Image */}
                <div className="category-marquee-item w-72 sm:w-80 lg:w-96 h-full flex-shrink-0">
                  <img src={finalImages[3]} alt={cat.name} loading="lazy" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryBanner;
