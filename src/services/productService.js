import { supabase } from '../lib/supabaseClient';

const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Solitaire Diamond Ring',
    category: 'rings',
    price: 75000,
    discount_price: 68000,
    rating: 4.9,
    review_count: 34,
    stock: 12,
    images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'],
    description: 'Classic 18k white gold solitaire engagement ring with a round brilliant cut lab-grown diamond. Timeless luxury and exceptional fire.',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Emerald Halo Pendant',
    category: 'necklaces',
    price: 42000,
    discount_price: null,
    rating: 4.8,
    review_count: 21,
    stock: 5,
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80'],
    description: 'Premium 14k yellow gold pendant featuring a deep green emerald surrounded by a halo of micro-paved diamonds. Elegant design for special occasions.',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Infinity Gold Bracelet',
    category: 'bracelets',
    price: 28000,
    discount_price: null,
    rating: 4.7,
    review_count: 15,
    stock: 8,
    images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'],
    description: 'Crafted in 18k solid rose gold, this delicate bracelet features an infinity link embellished with shimmering round cut diamonds.',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-4',
    name: 'Hanging Pearl Earrings',
    category: 'earrings',
    price: 18500,
    discount_price: 16200,
    rating: 4.6,
    review_count: 19,
    stock: 15,
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'],
    description: 'Lustrous white South Sea pearls suspended from delicate 18k gold hoops set with brilliant pavé diamonds. Refined and sophisticated.',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-5',
    name: 'Classic Cuban Link Chain',
    category: 'chains',
    price: 15000,
    discount_price: 12500,
    rating: 4.8,
    review_count: 42,
    stock: 20,
    images: ['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80'],
    description: 'Heavyweight 22k gold plated solid silver Cuban link chain. Features a high-polish finish and custom secure clasp mechanism.',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-6',
    name: 'Ruby Halo Studs',
    category: 'earrings',
    price: 35000,
    discount_price: null,
    rating: 4.7,
    review_count: 10,
    stock: 6,
    images: ['https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&q=80'],
    description: 'Stunning crimson ruby stud earrings set in 14k white gold. Surrounded by a radiant halo of brilliant diamonds.',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-7',
    name: 'Sapphire Drop Necklace',
    category: 'necklaces',
    price: 52000,
    discount_price: 48000,
    rating: 4.9,
    review_count: 28,
    stock: 4,
    images: ['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&q=80'],
    description: 'Elegant 18k white gold drop necklace featuring a pear-shaped royal blue sapphire suspended from a diamond bail.',
    created_at: new Date().toISOString()
  }
];

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
      let query = supabase.from('products').select('*');

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
        .select('*')
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
        .select('*')
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
        .select('*')
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
        .select('*')
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
  }
};
