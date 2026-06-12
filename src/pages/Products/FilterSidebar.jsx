import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Star, RotateCcw } from 'lucide-react';

const FilterSidebar = ({ filters, onFilterChange, onReset }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories for filter:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleCategorySelect = (categoryId) => {
    onFilterChange({ category: categoryId });
  };

  const handlePriceChange = (e, field) => {
    const val = e.target.value === '' ? '' : Number(e.target.value);
    onFilterChange({ [field]: val });
  };

  const handleRatingSelect = (rating) => {
    onFilterChange({ rating: filters.rating === rating ? 0 : rating });
  };

  const handleSortChange = (e) => {
    onFilterChange({ sortBy: e.target.value });
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm w-full lg:sticky lg:top-20">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 font-sans tracking-wide">Filters</h3>
        <button
          onClick={onReset}
          className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 flex items-center space-x-1 transition"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort Section */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Sort By
        </label>
        <select
          value={filters.sortBy || 'newest'}
          onChange={handleSortChange}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700/80 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary-500 transition"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price-low-high">Price: Low to High</option>
          <option value="price-high-low">Price: High to Low</option>
          <option value="rating">Average Rating</option>
        </select>
      </div>

      {/* Category Section */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Categories
        </span>
        <div className="flex flex-col space-y-1.5">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`text-left text-sm px-3 py-1.5.5 rounded-lg transition font-semibold ${
              !filters.category || filters.category === 'all'
                ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.name)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition font-semibold ${
                filters.category === cat.name
                  ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-bold'
                  : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Section */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Price Range (INR)
        </span>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice === '' || filters.minPrice === undefined ? '' : filters.minPrice}
            onChange={(e) => handlePriceChange(e, 'minPrice')}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700/80 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary-500"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice === '' || filters.maxPrice === undefined ? '' : filters.maxPrice}
            onChange={(e) => handlePriceChange(e, 'maxPrice')}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700/80 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Rating Section */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Customer Rating
        </span>
        <div className="flex flex-col space-y-1">
          {[4, 3, 2].map((stars) => (
            <button
              key={stars}
              onClick={() => handleRatingSelect(stars)}
              className={`flex items-center space-x-2 text-left text-sm px-3 py-1.5 rounded-lg transition font-semibold ${
                filters.rating === stars
                  ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-bold'
                  : 'text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < stars ? 'currentColor' : 'none'}
                    className={i < stars ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                  />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
