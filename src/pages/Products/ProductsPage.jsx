import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import FilterSidebar from './FilterSidebar';
import SearchBar from './SearchBar';
import ProductCard from '../../components/Reusable/ProductCard';
import SectionTitle from '../../components/Reusable/SectionTitle';
import { SkeletonGrid } from '../../components/Reusable/Loader';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductShowcaseSlider from './ProductShowcaseSlider';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse filters from search params
  const filters = useMemo(() => {
    return {
      category: searchParams.get('category') || 'all',
      search: searchParams.get('search') || '',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : 0,
      sortBy: searchParams.get('sortBy') || 'newest',
    };
  }, [searchParams]);

  // Query catalog using hook
  const { products, loading, error } = useProducts(filters);

  // Update URL params
  const handleFilterChange = (newFilters) => {
    const updated = {
      category: filters.category,
      search: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      rating: filters.rating,
      sortBy: filters.sortBy,
      ...newFilters
    };

    const params = {};
    Object.keys(updated).forEach(key => {
      const val = updated[key];
      if (val !== undefined && val !== null && val !== '' && val !== 0 && val !== 'all') {
        params[key] = String(val);
      }
    });

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Required SectionTitle */}
      <SectionTitle
        title="Our Collections"
        subtitle="Discover a diverse list of high-quality products suited to matches your preferences."
        align="left"
      />

      {/* Showcase Slider */}
      <ProductShowcaseSlider />

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        
        {/* Left Filter Column - Desktop */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Mobile Filter toggle button */}
        <div className="flex lg:hidden items-center justify-between gap-4">
          <SearchBar
            initialValue={filters.search}
            onSearch={(val) => handleFilterChange({ search: val })}
          />
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 text-sm font-semibold shadow-sm hover:bg-slate-50 transition"
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>
        </div>

        {/* Right Product Grid & Search Column */}
        <div className="flex-1 space-y-6">
          {/* Desktop Search Bar */}
          <div className="hidden lg:block max-w-md">
            <SearchBar
              initialValue={filters.search}
              onSearch={(val) => handleFilterChange({ search: val })}
            />
          </div>

          {/* Results stats */}
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
            <span>Showing {products.length} Products</span>
            {filters.category && filters.category !== 'all' && (
              <span className="bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-lg">
                Category: {filters.category}
              </span>
            )}
          </div>

          {/* Catalog Grid */}
          {error ? (
            <div className="p-8 text-center text-red-500 font-semibold text-sm">
              Error fetching products: {error}
            </div>
          ) : loading ? (
            <SkeletonGrid count={6} />
          ) : products.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
              No products found matching filters. Try resets.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer modal overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            onClick={() => setShowMobileFilters(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <div className="relative w-80 max-w-xs bg-white dark:bg-slate-900 h-full p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800 animate-fade-in shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Filter Options</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <FilterSidebar
              filters={filters}
              onFilterChange={(f) => {
                handleFilterChange(f);
                // keep open or close
              }}
              onReset={() => {
                handleResetFilters();
                setShowMobileFilters(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
