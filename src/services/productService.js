import { supabase } from '../lib/supabaseClient';

const MOCK_PRODUCTS = [];

const queryCache = {
  data: {},
  timestamp: {}
};

const CACHE_TTL = 30000; // 30 seconds cache TTL

const getCachedData = (key) => {
  const now = Date.now();
  if (queryCache.data[key] && now - queryCache.timestamp[key] < CACHE_TTL) {
    return queryCache.data[key];
  }
  return null;
};

const setCachedData = (key, data) => {
  queryCache.data[key] = data;
  queryCache.timestamp[key] = Date.now();
};

export const productService = {
  /**
   * Fetch all products matching criteria (category, price range, search query, rating, sorting).
   */
  async getProducts({ category, search, minPrice, maxPrice, rating, sortBy } = {}) {
    const cacheKey = `products-${JSON.stringify({ category, search, minPrice, maxPrice, rating, sortBy })}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase.from('products').select('*, offers(*)');

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (minPrice !== undefined && minPrice !== null) {
        query = query.gte('price', minPrice);
      }

      if (maxPrice !== undefined && maxPrice !== null) {
        query = query.lte('price', maxPrice);
      }

      if (rating) {
        query = query.gte('rating', rating);
      }

      if (sortBy) {
        switch (sortBy) {
          case 'price-low-high':
            query = query.order('price', { ascending: true });
            break;
          case 'price-high-low':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'newest':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setCachedData(cacheKey, data);
      return data;
    } catch (err) {
      console.warn('Supabase fetch failed. Falling back to local mockup data:', err.message);
      
      // Filter mock products locally
      let filtered = [...MOCK_PRODUCTS];
      if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
      }
      if (search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
      }
      if (minPrice !== undefined && minPrice !== null) {
        filtered = filtered.filter(p => p.price >= minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== null) {
        filtered = filtered.filter(p => p.price <= maxPrice);
      }
      if (rating) {
        filtered = filtered.filter(p => p.rating >= rating);
      }
      // Sort
      if (sortBy) {
        if (sortBy === 'price-low-high') {
          filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high-low') {
          filtered.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'rating') {
          filtered.sort((a, b) => b.rating - a.rating);
        }
      }
      setCachedData(cacheKey, filtered);
      return filtered;
    }
  },

  /**
   * Fetch a single product by ID.
   */
  async getProductById(id) {
    const cacheKey = `product-id-${id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, offers(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      setCachedData(cacheKey, data);
      return data;
    } catch (err) {
      console.warn(`Supabase getProductById failed for id ${id}. Falling back to mockup:`, err.message);
      const match = MOCK_PRODUCTS.find(p => p.id === id);
      if (match) {
        setCachedData(cacheKey, match);
        return match;
      }
      throw err;
    }
  },

  /**
   * Fetch a single product by Slug.
   */
  async getProductBySlug(slug) {
    const cacheKey = `product-slug-${slug}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, offers(*)')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      setCachedData(cacheKey, data);
      return data;
    } catch (err) {
      console.warn(`Supabase getProductBySlug failed for slug ${slug}. Falling back to mockup:`, err.message);
      const match = MOCK_PRODUCTS.find(p => p.slug === slug);
      if (match) {
        setCachedData(cacheKey, match);
        return match;
      }
      throw err;
    }
  },

  /**
   * Get featured products (e.g. limit 8 for HomePage)
   */
  async getFeaturedProducts(limit = 8) {
    const cacheKey = `featured-limit-${limit}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, offers(*)')
        .order('rating', { ascending: false })
        .limit(limit);
      if (error) throw error;
      setCachedData(cacheKey, data);
      return data;
    } catch (err) {
      console.warn('Supabase getFeaturedProducts failed. Falling back to mockup:', err.message);
      const fallback = MOCK_PRODUCTS.slice(0, limit);
      setCachedData(cacheKey, fallback);
      return fallback;
    }
  },

  /**
   * Fetch related products from the same category.
   */
  async getRelatedProducts(category, currentProductId, limit = 4) {
    const cacheKey = `related-${category}-${currentProductId}-${limit}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, offers(*)')
        .eq('category', category)
        .neq('id', currentProductId)
        .limit(limit);
      if (error) throw error;
      setCachedData(cacheKey, data);
      return data;
    } catch (err) {
      console.warn('Supabase getRelatedProducts failed. Falling back to mockup:', err.message);
      const fallback = MOCK_PRODUCTS
        .filter(p => p.category === category && p.id !== currentProductId)
        .slice(0, limit);
      setCachedData(cacheKey, fallback);
      return fallback;
    }
  },

  /**
   * Fetch product along with its active offer (joining products + offers where offer is active).
   */
  async fetchProductWithOffer(slug) {
    const { data, error } = await supabase
      .from('products')
      .select('*, offers!inner(*)')
      .eq('slug', slug)
      .eq('offers.is_active', true)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Fetch active offers for promotional banners.
   */
  async fetchActiveOffers() {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data;
  }
};
