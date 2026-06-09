import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CATEGORIES } from '../../utils/constants';
import SectionTitle from '../../components/Reusable/SectionTitle';

gsap.registerPlugin(ScrollTrigger);

const CATEGORY_IMAGES = {
  rings: [
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1543294001-f7cbfe92237e?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=500&auto=format&fit=crop&q=60',
  ],
  necklaces: [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60',
  ],
  earrings: [
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=500&auto=format&fit=crop&q=60',
  ],
  bracelets: [
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1602752275313-477eaabc497c?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=60',
  ],
  chains: [
    'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop&q=60',
  ],
};

const CategoryBanner = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const containers = container.querySelectorAll('.category-marquee-container');
    const tweens = [];

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

    // Cleanup tweens and ScrollTriggers
    return () => {
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    };
  }, []);

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
        {CATEGORIES.map((cat, index) => {
          const catImages = CATEGORY_IMAGES[cat.id] || [];
          
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
                  <img src={catImages[0] || cat.image} alt={cat.name} loading="lazy" />
                </div>
                
                {/* Item 2: Text Title (Double-width column) */}
                <div className="category-marquee-item with-text w-96 sm:w-[28rem] lg:w-[32rem] h-full flex-shrink-0">
                  <Link to={`/products?category=${cat.id}`} className="block">
                    <h1 className="item-title select-none">
                      {cat.name.split('').map((char, charIdx) => (
                        <span key={charIdx} className="category-char inline-block" style={{ fontWeight: 100 }}>
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))}
                    </h1>
                  </Link>
                </div>
                
                {/* Item 3: Image */}
                <div className="category-marquee-item w-72 sm:w-80 lg:w-96 h-full flex-shrink-0">
                  <img src={catImages[1] || cat.image} alt={cat.name} loading="lazy" />
                </div>
                
                {/* Item 4: Image */}
                <div className="category-marquee-item w-72 sm:w-80 lg:w-96 h-full flex-shrink-0">
                  <img src={catImages[2] || cat.image} alt={cat.name} loading="lazy" />
                </div>
                
                {/* Item 5: Image */}
                <div className="category-marquee-item w-72 sm:w-80 lg:w-96 h-full flex-shrink-0">
                  <img src={catImages[3] || cat.image} alt={cat.name} loading="lazy" />
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
