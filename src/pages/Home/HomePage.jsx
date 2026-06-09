import React from 'react';
import HeroSection from './HeroSection';
import CategoryBanner from './CategoryBanner';
import FeaturedProducts from './FeaturedProducts';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner Component */}
      <HeroSection />

      {/* Category Selection Grid */}
      <CategoryBanner />

      {/* Product Catalog Highlight Grid */}
      <FeaturedProducts />
    </div>
  );
};

export default HomePage;
