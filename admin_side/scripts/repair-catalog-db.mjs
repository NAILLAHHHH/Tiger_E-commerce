/**
 * Repair empty catalog fields in SQLite (prices, slugs, category photos).
 * Run: node admin_side/scripts/repair-catalog-db.mjs
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../.tmp/data.db'));

const categories = [
  { name: 'T-Shirts', link_name: 't-shirts', photo: '/products/21-tygastyle-tee-set.png', list_position: 1 },
  { name: 'Hoodies & Knitwear', link_name: 'hoodies', photo: '/products/01-grey-zip-hoodie.png', list_position: 2 },
  { name: 'Pants', link_name: 'pants', photo: '/products/16-navy-chino-pants.png', list_position: 3 },
  { name: 'Formal & Suits', link_name: 'formal', photo: '/products/13-suit-collection.png', list_position: 4 },
  { name: 'Jackets', link_name: 'jackets', photo: '/products/18-bomber-jacket.png', list_position: 5 },
];

const products = [
  {
    name: 'Heather Grey Zip Hoodie',
    link_name: 'heather-grey-zip-hoodie',
    description: 'Oversized heather grey zip hoodie with kangaroo pockets.',
    highlight_on_homepage: 1,
    mark_as_new: 1,
    category_link: 'hoodies',
    variants: [
      { size: 'M', color: 'Heather Grey', item_code: 'Grey-Hoodie-M', color_dot: '#A8A29E', price_for_one: 65, price_for_bulk: 45, min_quantity_for_bulk: 10, how_many_left: 28 },
      { size: 'L', color: 'Heather Grey', item_code: 'Grey-Hoodie-L', color_dot: '#A8A29E', price_for_one: 65, price_for_bulk: 45, min_quantity_for_bulk: 10, how_many_left: 22 },
    ],
  },
  {
    name: 'Quarter-Zip Bulk Color Pack',
    link_name: 'quarter-zip-bulk-color-pack',
    description: 'Wholesale pack of quarter-zip pullovers in mixed colors.',
    highlight_on_homepage: 1,
    mark_as_new: 0,
    category_link: 'hoodies',
    variants: [
      { size: 'M', color: 'Mixed', item_code: 'Zip-Pack-M', color_dot: '#737373', price_for_one: 700, price_for_bulk: 29, min_quantity_for_bulk: 24, how_many_left: 200 },
    ],
  },
  {
    name: 'Navy Chino Pants',
    link_name: 'navy-chino-pants',
    description: 'Classic navy chino pants with a tailored fit.',
    highlight_on_homepage: 1,
    mark_as_new: 0,
    category_link: 'pants',
    variants: [
      { size: '32', color: 'Navy', item_code: 'Navy-Pants-32', color_dot: '#1E3A5F', price_for_one: 55, price_for_bulk: 37, min_quantity_for_bulk: 15, how_many_left: 30 },
      { size: '34', color: 'Navy', item_code: 'Navy-Pants-34', color_dot: '#1E3A5F', price_for_one: 55, price_for_bulk: 37, min_quantity_for_bulk: 15, how_many_left: 25 },
    ],
  },
  {
    name: 'TygaStyle Tee Set',
    link_name: 'tygastyle-tee-set',
    description: 'Graphic tee set — per piece and bulk available.',
    highlight_on_homepage: 1,
    mark_as_new: 1,
    category_link: 't-shirts',
    variants: [
      { size: 'M', color: 'Black', item_code: 'Tee-Black-M', color_dot: '#0A0A0A', price_for_one: 25, price_for_bulk: 19, min_quantity_for_bulk: 12, how_many_left: 62 },
      { size: 'L', color: 'Black', item_code: 'Tee-Black-L', color_dot: '#0A0A0A', price_for_one: 25, price_for_bulk: 19, min_quantity_for_bulk: 12, how_many_left: 48 },
    ],
  },
  {
    name: 'Suit Collection — Tan',
    link_name: 'suit-collection-tan',
    description: 'Two-piece tan suit.',
    highlight_on_homepage: 0,
    mark_as_new: 0,
    category_link: 'formal',
    variants: [
      { size: '40R', color: 'Tan', item_code: 'Tan-Suit-40R', color_dot: '#C4A574', price_for_one: 350, price_for_bulk: 250, min_quantity_for_bulk: 5, how_many_left: 8 },
    ],
  },
  {
    name: 'Bomber Jacket',
    link_name: 'bomber-jacket',
    description: 'Classic bomber jacket in black — sold per piece only.',
    highlight_on_homepage: 1,
    mark_as_new: 1,
    category_link: 'jackets',
    variants: [
      { size: 'M', color: 'Black', item_code: 'Bomber-Black-M', color_dot: '#0A0A0A', price_for_one: 90, price_for_bulk: null, min_quantity_for_bulk: 10, how_many_left: 15 },
    ],
  },
];

const updateCategory = db.prepare(`
  UPDATE categories
  SET link_name = @link_name, photo = @photo, list_position = @list_position
  WHERE name = @name
`);

const getCategoryId = db.prepare(`SELECT id FROM categories WHERE link_name = ?`);
const updateProduct = db.prepare(`
  UPDATE products
  SET link_name = @link_name,
      description = @description,
      highlight_on_homepage = @highlight_on_homepage,
      mark_as_new = @mark_as_new
  WHERE name = @name
`);
const linkProductCategory = db.prepare(`
  UPDATE products_category_lnk
  SET category_id = ?
  WHERE product_id = ?
`);
const findProductCategoryLink = db.prepare(`
  SELECT category_id FROM products_category_lnk WHERE product_id = ?
`);
const insertProductCategoryLink = db.prepare(`
  INSERT INTO products_category_lnk (product_id, category_id, product_ord) VALUES (?, ?, 1)
`);
const getProductId = db.prepare(`SELECT id FROM products WHERE name = ?`);
const updateVariant = db.prepare(`
  UPDATE product_variants
  SET item_code = @item_code,
      color_dot = @color_dot,
      price_for_one = @price_for_one,
      price_for_bulk = @price_for_bulk,
      min_quantity_for_bulk = @min_quantity_for_bulk,
      how_many_left = @how_many_left
  WHERE size = @size AND color = @color
    AND id IN (
      SELECT product_variant_id FROM product_variants_product_lnk WHERE product_id = @product_id
    )
`);

for (const cat of categories) {
  updateCategory.run(cat);
  console.log(`category: ${cat.name}`);
}

for (const product of products) {
  updateProduct.run(product);
  const row = getProductId.get(product.name);
  if (!row) continue;

  const cat = getCategoryId.get(product.category_link);
  if (cat) {
    const link = findProductCategoryLink.get(row.id);
    if (link) linkProductCategory.run(cat.id, row.id);
    else insertProductCategoryLink.run(row.id, cat.id);
  }

  for (const variant of product.variants) {
    updateVariant.run({ ...variant, product_id: row.id });
  }
  console.log(`product: ${product.name}`);
}

db.close();
console.log('Done. Restart Strapi or wait for next request — prices and links are fixed.');
