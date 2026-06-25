# TigerWear E-commerce

Next.js storefront for a clothing seller — **retail (per piece)** and **wholesale (bulk)** with live inventory by size and color. UI layout inspired by [NextMerce](https://demo.nextmerce.com/), with a warm terracotta palette instead of the default blue.

## Stack

- **Next.js 16** (App Router)
- **Strapi 5** (`admin_side/`) — products, variants, stock, orders, admin panel
- **Zustand** — cart (persisted in localStorage)
- **Tailwind CSS v4**

## Quick start

```bash
npm install
cp .env.local.example .env.local   # uses Strapi at localhost:1337
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Also run Strapi** (in another terminal):

```bash
cd ../admin_side
npm run develop
```

Admin panel: [http://localhost:1337/admin](http://localhost:1337/admin)

Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local` to browse without Strapi (local mock catalog).

## Docker (production)

Build and run the container:

```bash
docker build -t tiger-ecommerce .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_USE_MOCK_DATA=true \
  tiger-ecommerce
```

Or with Supabase:

```bash
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  -e NEXT_PUBLIC_USE_MOCK_DATA=false \
  tiger-ecommerce
```

Compose:

```bash
NEXT_PUBLIC_USE_MOCK_DATA=true docker compose up --build
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` → `.env.local` and add your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_USE_MOCK_DATA=false
```

1. In the Supabase SQL editor, run in order:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/seed.sql`

## Database schema


| Table                     | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `categories`              | T-Shirts, Hoodies, etc.                                              |
| `products`                | Name, retail price, sell mode (`retail` / `wholesale` / `both`), MOQ |
| `product_variants`        | SKU, size, color, **stock_quantity**                                 |
| `wholesale_pricing_tiers` | Bulk price breaks (e.g. 12+ @ $18.99)                                |
| `inventory_movements`     | Audit log when stock changes                                         |


Stock is decremented via `decrement_variant_stock()` (wire this at checkout).

## Pages


| Route          | Description                                            |
| -------------- | ------------------------------------------------------ |
| `/`            | Hero, categories, new arrivals, featured               |
| `/shop`        | Product grid with category filters                     |
| `/shop/[slug]` | PDP with size/color, retail vs bulk toggle, tier table |
| `/wholesale`   | Bulk-focused catalog                                   |
| `/cart`        | Cart with retail/wholesale line items                  |


## Design notes

- **NextMerce-inspired**: hero carousel, category grid, product cards with hover CTA, features bar, promo banners, newsletter
- **TigerWear palette**: terracotta `#C2410C`, cream background `#FAF7F2`, charcoal text — replaces NextMerce blue

## Next steps

- Stripe checkout + webhook to call `decrement_variant_stock`
- Admin panel for inventory updates
- Auth for wholesale customer accounts

