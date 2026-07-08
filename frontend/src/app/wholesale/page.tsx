import type { Metadata } from "next";
import Link from "next/link";
import WholesaleProductCard from "@/components/shop/WholesaleProductCard";
import { getWholesaleProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Wholesale & bulk",
  description:
    "Order many pieces at a lower price. Pay instantly with MTN MoMo — we'll call you for further details.",
};

const steps = [
  {
    title: "Pick your items",
    desc: "Choose size, color, and how many pieces you need.",
  },
  {
    title: "Place your order & pay",
    desc: "Checkout and pay instantly with MTN MoMo.",
  },
  {
    title: "We call you",
    desc: "Our team calls for delivery and any other details.",
  },
];

export default async function WholesalePage() {
  const products = await getWholesaleProducts();

  return (
    <div className="container-custom py-10">
      <section className="mb-10 overflow-hidden rounded-2xl bg-dark text-white">
        <div className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              Buy many, pay less
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Bulk orders for shops, teams & events
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-gray-4">
              Each product shows how many pieces you need to buy for the lower
              price. Mix sizes and colors in one order — pay instantly at
              checkout, then we&apos;ll call you for further details.
            </p>
            <Link href="/shop" className="btn-primary mt-6 inline-flex">
              Browse full shop
            </Link>
          </div>

          <ul className="grid gap-4 self-center">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-xl bg-dark-4/80 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-gray-4">{step.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">Products with bulk pricing</h2>
          <p className="mt-2 text-sm text-muted">
            {products.length}{" "}
            {products.length === 1 ? "item" : "items"} — open any product to
            choose size, color, and quantity.
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-3 bg-gray-1 px-6 py-16 text-center">
          <p className="text-lg font-medium text-dark">No bulk offers yet</p>
          <p className="mt-2 text-sm text-muted">
            Products with a &ldquo;buy many&rdquo; price will show up here.
          </p>
          <Link href="/shop" className="btn-primary mt-6 inline-flex">
            Shop all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <WholesaleProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl border border-gray-3 bg-gray-1 p-6 text-center md:p-8">
        <h3 className="font-semibold text-dark">Questions about a large order?</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
          Add items to your cart, checkout, and pay with MTN MoMo. We&apos;ll
          call you after payment for delivery and any other details.
        </p>
        <Link href="/cart" className="btn-outline mt-4 inline-flex">
          Go to cart
        </Link>
      </div>
    </div>
  );
}
