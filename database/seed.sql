-- ============================================================
-- SEED: Jewelry Products for Soshka Store
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- Project: bmbegjxfkpyenndfbcdj
-- ============================================================

-- First, clear any existing products
DELETE FROM public.products;

-- Insert jewelry products
INSERT INTO public.products (name, slug, description, price, discount_price, stock, category, images, rating, review_count)
VALUES
  (
    'Solitaire Diamond Ring',
    'solitaire-diamond-ring',
    'Classic 18k white gold solitaire engagement ring with a round brilliant cut lab-grown diamond. Timeless luxury and exceptional fire.',
    75000, 68000, 12, 'rings',
    ARRAY['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'],
    4.9, 34
  ),
  (
    'Emerald Halo Pendant',
    'emerald-halo-pendant',
    'Premium 14k yellow gold pendant featuring a deep green emerald surrounded by a halo of micro-paved diamonds. Elegant design for special occasions.',
    42000, NULL, 5, 'necklaces',
    ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80'],
    4.8, 21
  ),
  (
    'Infinity Gold Bracelet',
    'infinity-gold-bracelet',
    'Crafted in 18k solid rose gold, this delicate bracelet features an infinity link embellished with shimmering round cut diamonds.',
    28000, NULL, 8, 'bracelets',
    ARRAY['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'],
    4.7, 15
  ),
  (
    'Hanging Pearl Earrings',
    'hanging-pearl-earrings',
    'Lustrous white South Sea pearls suspended from delicate 18k gold hoops set with brilliant pave diamonds. Refined and sophisticated.',
    18500, 16200, 15, 'earrings',
    ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'],
    4.6, 19
  ),
  (
    'Classic Cuban Link Chain',
    'classic-cuban-link-chain',
    'Heavyweight 22k gold plated solid silver Cuban link chain. Features a high-polish finish and custom secure clasp mechanism.',
    15000, 12500, 20, 'chains',
    ARRAY['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80'],
    4.8, 42
  ),
  (
    'Ruby Halo Studs',
    'ruby-halo-studs',
    'Stunning crimson ruby stud earrings set in 14k white gold. Surrounded by a radiant halo of brilliant diamonds.',
    35000, NULL, 6, 'earrings',
    ARRAY['https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=600&q=80'],
    4.7, 10
  ),
  (
    'Sapphire Drop Necklace',
    'sapphire-drop-necklace',
    'Elegant 18k white gold drop necklace featuring a pear-shaped royal blue sapphire suspended from a diamond bail.',
    52000, 48000, 4, 'necklaces',
    ARRAY['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&q=80'],
    4.9, 28
  ),
  (
    'Rose Gold Twisted Band',
    'rose-gold-twisted-band',
    'A beautifully twisted 18k rose gold band ring, perfect for stacking or wearing alone. Smooth finish with a warm rosy tone.',
    22000, 19500, 10, 'rings',
    ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80'],
    4.5, 33
  ),
  (
    'Diamond Tennis Bracelet',
    'diamond-tennis-bracelet',
    'Classic 14k white gold tennis bracelet set with 42 round brilliant diamonds in a channel setting. A timeless statement piece.',
    89000, NULL, 3, 'bracelets',
    ARRAY['https://images.unsplash.com/photo-1599458252573-56ae36120de1?w=600&q=80'],
    5.0, 12
  ),
  (
    'Gold Layered Necklace',
    'gold-layered-necklace',
    'Delicate multi-strand 18k gold necklace with subtle satellite chain detailing. Perfect for everyday layered looks.',
    19000, 15500, 18, 'necklaces',
    ARRAY['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80'],
    4.6, 47
  ),
  (
    'Emerald Cut Stud Earrings',
    'emerald-cut-stud-earrings',
    'Elegant emerald-cut diamond stud earrings in platinum. Clean lines and brilliant sparkle for a refined, minimalist look.',
    45000, 41000, 7, 'earrings',
    ARRAY['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80'],
    4.8, 16
  ),
  (
    'Rope Chain Necklace',
    'rope-chain-necklace',
    'Bold 22k gold rope chain with a classic twisted design. Sturdy construction with a secure lobster clasp.',
    12500, NULL, 25, 'chains',
    ARRAY['https://images.unsplash.com/photo-1561173927-a4f63f0d59e0?w=600&q=80'],
    4.4, 38
  );

-- Verify insert
SELECT count(*) as total_products FROM public.products;
