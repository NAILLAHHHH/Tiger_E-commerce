-- Run after 001_initial_schema.sql in Supabase SQL editor

INSERT INTO categories (name, slug, image_url, sort_order) VALUES
  ('T-Shirts', 't-shirts', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 1),
  ('Hoodies', 'hoodies', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', 2),
  ('Pants', 'pants', 'https://images.unsplash.com/photo-1473966968600-fa801b279ec0?w=400', 3),
  ('Dresses', 'dresses', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 4);

-- Classic Cotton Tee
WITH cat AS (SELECT id FROM categories WHERE slug = 't-shirts'),
ins AS (
  INSERT INTO products (name, slug, description, retail_price, compare_at_price, category_id, image_url, sell_mode, moq_wholesale, is_featured, is_new)
  SELECT
    'Classic Cotton Tee',
    'classic-cotton-tee',
    'Soft 100% cotton tee. Relaxed fit, perfect for everyday wear or bulk branding.',
    24.99,
    32.00,
    cat.id,
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    'both',
    12,
    true,
    true
  FROM cat
  RETURNING id
)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock_quantity)
SELECT id, sku, size, color, color_hex, stock FROM ins, (VALUES
  ('TEE-BLK-S', 'S', 'Black', '#1C1917', 45),
  ('TEE-BLK-M', 'M', 'Black', '#1C1917', 62),
  ('TEE-BLK-L', 'L', 'Black', '#1C1917', 38),
  ('TEE-WHT-M', 'M', 'White', '#FAFAF9', 55),
  ('TEE-WHT-L', 'L', 'White', '#FAFAF9', 40)
) AS v(sku, size, color, color_hex, stock);

INSERT INTO wholesale_pricing_tiers (product_id, min_quantity, unit_price)
SELECT id, qty, price FROM products p, (VALUES
  (12, 18.99),
  (36, 15.99),
  (72, 13.50)
) AS t(qty, price) WHERE p.slug = 'classic-cotton-tee';

-- Fleece Zip Hoodie
WITH cat AS (SELECT id FROM categories WHERE slug = 'hoodies'),
ins AS (
  INSERT INTO products (name, slug, description, retail_price, compare_at_price, category_id, image_url, sell_mode, moq_wholesale, is_featured)
  SELECT
    'Fleece Zip Hoodie',
    'fleece-zip-hoodie',
    'Mid-weight fleece with full zip and kangaroo pockets. Ideal for retail or bulk orders.',
    59.99,
    74.99,
    cat.id,
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    'both',
    10,
    true
  FROM cat
  RETURNING id
)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock_quantity)
SELECT id, sku, size, color, color_hex, stock FROM ins, (VALUES
  ('HDG-GRY-M', 'M', 'Heather Grey', '#A8A29E', 28),
  ('HDG-GRY-L', 'L', 'Heather Grey', '#A8A29E', 22),
  ('HDG-NVY-M', 'M', 'Navy', '#1E3A5F', 30),
  ('HDG-NVY-XL', 'XL', 'Navy', '#1E3A5F', 18)
) AS v(sku, size, color, color_hex, stock);

INSERT INTO wholesale_pricing_tiers (product_id, min_quantity, unit_price)
SELECT id, qty, price FROM products p, (VALUES
  (10, 44.99),
  (25, 39.99),
  (50, 34.99)
) AS t(qty, price) WHERE p.slug = 'fleece-zip-hoodie';

-- Slim Chino Pants
WITH cat AS (SELECT id FROM categories WHERE slug = 'pants'),
ins AS (
  INSERT INTO products (name, slug, description, retail_price, category_id, image_url, sell_mode, moq_wholesale, is_new)
  SELECT
    'Slim Chino Pants',
    'slim-chino-pants',
    'Tailored slim fit chinos in stretch cotton twill. Wholesale-friendly sizing runs.',
    49.99,
    cat.id,
    'https://images.unsplash.com/photo-1473966968600-fa801b279ec0?w=800',
    'both',
    15,
    true
  FROM cat
  RETURNING id
)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock_quantity)
SELECT id, sku, size, color, color_hex, stock FROM ins, (VALUES
  ('CHN-KHK-30', '30', 'Khaki', '#C4A574', 20),
  ('CHN-KHK-32', '32', 'Khaki', '#C4A574', 25),
  ('CHN-KHK-34', '34', 'Khaki', '#C4A574', 15),
  ('CHN-BLK-32', '32', 'Black', '#1C1917', 18)
) AS v(sku, size, color, color_hex, stock);

INSERT INTO wholesale_pricing_tiers (product_id, min_quantity, unit_price)
SELECT id, qty, price FROM products p, (VALUES
  (15, 36.99),
  (40, 31.99)
) AS t(qty, price) WHERE p.slug = 'slim-chino-pants';

-- Wholesale-only bulk pack
WITH cat AS (SELECT id FROM categories WHERE slug = 't-shirts'),
ins AS (
  INSERT INTO products (name, slug, description, retail_price, category_id, image_url, sell_mode, moq_wholesale)
  SELECT
    'Blank Tee Bulk Pack (24pc)',
    'blank-tee-bulk-pack',
    'Unbranded premium blanks sold in packs of 24. Wholesale only — perfect for screen printers.',
    399.99,
    cat.id,
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
    'wholesale',
    24
  FROM cat
  RETURNING id
)
INSERT INTO product_variants (product_id, sku, size, color, color_hex, stock_quantity)
SELECT id, sku, size, color, color_hex, stock FROM ins, (VALUES
  ('BLK-24-M-WHT', 'M', 'White Mix', '#FAFAF9', 120),
  ('BLK-24-L-WHT', 'L', 'White Mix', '#FAFAF9', 96)
) AS v(sku, size, color, color_hex, stock);

INSERT INTO wholesale_pricing_tiers (product_id, min_quantity, unit_price)
SELECT id, qty, price FROM products p, (VALUES
  (24, 14.99),
  (48, 12.99),
  (96, 10.99)
) AS t(qty, price) WHERE p.slug = 'blank-tee-bulk-pack';
