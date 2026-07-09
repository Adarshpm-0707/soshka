import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Manually parse .env file to extract Supabase details
const envPath = path.resolve('.env');
const env = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value.trim();
    }
  });
}

const supabaseUrl = env['VITE_SUPABASE_URL'] || process.env.VITE_SUPABASE_URL;
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase credentials not found. Cannot generate sitemap.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
  try {
    console.log('Fetching active products from Supabase...');
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, category');

    if (error) {
      throw error;
    }

    const staticPaths = [
      '',
      'products',
      'about',
      'contact',
      'terms',
      'returns-refunds',
      'refund-policy',
      'privacy-policy',
      'shipping-policy',
      'login',
      'register',
      'reviews',
      'cart',
      'wishlist',
      'profile'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static paths
    staticPaths.forEach(p => {
      xml += `  <url>
    <loc>https://soshka.in/${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>\n`;
    });

    // Categories
    const categories = ['rings', 'necklaces', 'earrings', 'bracelets', 'chains'];
    categories.forEach(cat => {
      xml += `  <url>
    <loc>https://soshka.in/products?category=${encodeURIComponent(cat)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // Products
    if (products && products.length > 0) {
      products.forEach(prod => {
        if (prod.slug) {
          xml += `  <url>
    <loc>https://soshka.in/products/${prod.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
        }
      });
      console.log(`Added ${products.length} product slugs to sitemap.`);
    }

    xml += `</urlset>`;

    const destDir = path.resolve('public');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.writeFileSync(path.resolve('public/sitemap.xml'), xml);
    console.log('Sitemap successfully compiled in public/sitemap.xml!');
  } catch (err) {
    console.error('Error generating sitemap:', err.message);
    process.exit(1);
  }
}

generateSitemap();
