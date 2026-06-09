import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';

/**
 * Custom hook to fetch products list with filters.
 * @param {Object} filters - Filtering criteria (category, search, minPrice, maxPrice, rating, sortBy)
 */
export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize filters to prevent redundant fetches
  const filterKey = JSON.stringify(filters);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProducts(filters);
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
      console.error('Error in useProducts hook:', err);
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts
  };
};
