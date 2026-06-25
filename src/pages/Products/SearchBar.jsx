import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { debounce } from '../../utils/helpers';

const SearchBar = ({ onSearch, initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);

  // Sync state if initialValue changes (e.g. on navigation)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Create debounced function using our helper
  const debouncedSearch = useCallback(
    debounce((query) => {
      onSearch(query);
    }, 300),
    [onSearch]
  );

  const handleChange = (e) => {
    const newVal = e.target.value;
    setValue(newVal);
    debouncedSearch(newVal);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search product name..."
        value={value}
        onChange={handleChange}
        className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400 transition shadow-sm"
      />
      <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
    </div>
  );
};

export default SearchBar;
