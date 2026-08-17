# TygaMart Node admin

Custom staff Content Manager (Strapi-style workflows, no Content-Type Builder / roles UI).

Runs on **port 1338**. The Postgres database is **tygamart** (`localhost:5433`).

## Permanent owner + staff

On every boot the API ensures an **owner** account from env:

```bash
ADMIN_EMAIL=admin@tygamart.com
ADMIN_PASSWORD=your-strong-password
ADMIN_NAME=TygaMart Owner
```

That owner can sign in locally and in production. Other staff are added under **General → Staff users** in the admin UI.

## Features

- Collection Types + Single Types sidebar layout
- Draft / Publish for products & categories (storefront only shows published)
- Full CRUD for Options (values are edited on the same form), Product kinds
- Stock/price change reasons + audit logs
- Orders status → stock sync
- Export / Template / Import on each list table toolbar
- Media upload (local `/uploads` or Cloudinary)

## Run

```bash
cd admin_side_node
npm run db:setup   # first time
npm run dev        # http://localhost:1338
```

Login: `admin@tygamart.com` / value of `ADMIN_PASSWORD` in `.env`
