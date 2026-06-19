"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/pricing";
import { resolveProductImage } from "@/lib/images";
import {
  selectCartTotal,
  useCartStore,
} from "@/store/cart-store";

export default function CartPageClient() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = selectCartTotal(items);

  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          phone,
          address,
          notes,
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to place order");
        return;
      }

      setOrderNumber(data.order_number ?? "confirmed");
      clearCart();
      setShowCheckout(false);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderNumber) {
    return (
      <div className="rounded-2xl bg-surface py-16 text-center shadow-[var(--shadow-soft)]">
        <p className="text-lg font-semibold text-dark">Order placed!</p>
        <p className="mt-2 text-sm text-muted">
          Reference: <span className="font-mono text-brand">{orderNumber}</span>
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted">
          Our team will contact you to confirm details and arrange payment.
        </p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-surface py-16 text-center shadow-[var(--shadow-soft)]">
        <p className="text-lg font-medium text-dark">Your cart is empty</p>
        <p className="mt-2 text-sm text-muted">
          Browse our catalog for retail or bulk orders.
        </p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => (
          <div
            key={item.variantId}
            className="flex gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-1">
              {item.image && (
                <Image
                  src={resolveProductImage(item.image)}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <Link
                href={`/shop/${item.slug}`}
                className="font-medium text-dark hover:text-brand"
              >
                {item.name}
              </Link>
              <p className="text-xs text-muted">
                {item.color} · Size {item.size} · {item.sku}
              </p>
              <p className="text-xs text-muted capitalize">
                {item.pricingMode} · {formatPrice(item.unitPrice)}/unit
              </p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity - 1)
                    }
                    className="h-8 w-8 rounded border border-gray-3"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.variantId, item.quantity + 1)
                    }
                    className="h-8 w-8 rounded border border-gray-3"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-brand">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-muted hover:text-red-600"
        >
          Clear cart
        </button>
      </div>

      <div className="h-fit rounded-xl bg-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-dark">Order summary</h2>
        <div className="mt-4 space-y-2 border-b border-gray-2 pb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment</span>
            <span className="text-muted">After admin contact</span>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-brand">{formatPrice(total)}</span>
        </div>

        {!showCheckout ? (
          <>
            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              className="btn-primary mt-6 w-full py-3"
            >
              Place order
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              We&apos;ll call you to confirm and arrange payment.
            </p>
          </>
        ) : (
          <form onSubmit={handlePlaceOrder} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-medium text-dark" htmlFor="name">
                Full name *
              </label>
              <input
                id="name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-3 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark" htmlFor="phone">
                Phone / WhatsApp *
              </label>
              <input
                id="phone"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-3 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark" htmlFor="address">
                Address
              </label>
              <input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-3 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-3 px-3 py-2 text-sm"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit order"}
            </button>
            <button
              type="button"
              onClick={() => setShowCheckout(false)}
              className="w-full text-sm text-muted hover:text-dark"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
