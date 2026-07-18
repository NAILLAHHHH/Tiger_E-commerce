"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import MomoPayInstructions from "@/components/cart/MomoPayInstructions";
import PhoneInput from "@/components/cart/PhoneInput";
import { formatPrice, lineTotal } from "@/lib/pricing";
import {
  buildOrderWhatsAppMessage,
  whatsappUrl,
} from "@/lib/contact";
import { resolveProductImage } from "@/lib/images";
import { orderSummaryUrl } from "@/lib/orders";
import {
  DEFAULT_COUNTRY,
  formatInternationalPhone,
  isValidPhoneForCountry,
  type CountryDial,
} from "@/lib/phone";
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
  const [phoneCountry, setPhoneCountry] =
    useState<CountryDial>(DEFAULT_COUNTRY);
  const [phoneNational, setPhoneNational] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderDocumentId, setOrderDocumentId] = useState<string | null>(null);
  const [placedOrderTotal, setPlacedOrderTotal] = useState<number | null>(null);
  const [orderWhatsAppHref, setOrderWhatsAppHref] = useState<string | null>(
    null,
  );

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhoneError(null);

    if (!isValidPhoneForCountry(phoneCountry.code, phoneNational)) {
      setPhoneError(
        `Enter a valid ${phoneCountry.name} phone number`,
      );
      return;
    }

    const fullPhone = formatInternationalPhone(
      phoneCountry.code,
      phoneNational,
    );
    if (!fullPhone) {
      setPhoneError("Enter a valid phone number");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          phone: fullPhone,
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

      const ref = data.order_number ?? "confirmed";
      const message = buildOrderWhatsAppMessage({
        orderNumber: ref,
        customerName,
        phone: fullPhone,
        address,
        notes,
        items,
        total,
        summaryUrl: orderSummaryUrl(ref),
      });
      const waHref = whatsappUrl(message);

      setPlacedOrderTotal(total);
      setOrderDocumentId(data.documentId ?? null);
      setOrderWhatsAppHref(waHref);
      setOrderNumber(ref);
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
        {placedOrderTotal != null &&
          placedOrderTotal > 0 &&
          orderDocumentId && (
          <div className="mx-auto mt-6 max-w-md text-left">
            <MomoPayInstructions
              amount={placedOrderTotal}
              documentId={orderDocumentId}
              orderReference={orderNumber ?? undefined}
            />
          </div>
        )}
        <p className="mx-auto mt-4 max-w-md text-sm text-muted">
          Pay with MoMo first, then send us your order on WhatsApp so we can
          confirm and arrange delivery.
        </p>
        <div className="mx-auto mt-8 flex w-full max-w-sm flex-col items-stretch gap-3">
          {orderWhatsAppHref && (
            <a
              href={orderWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-[5px] bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe57]"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Send order on WhatsApp
            </a>
          )}
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-[5px] border border-gray-3 bg-surface px-5 py-3 text-sm font-medium text-dark transition-colors hover:border-brand hover:text-brand"
          >
            Continue shopping
          </Link>
        </div>
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
                {item.color} · Size {item.size} · Code {item.sku}
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
                    {formatPrice(lineTotal(item.unitPrice, item.quantity))}
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
            <span className="text-muted">MTN MoMo Pay</span>
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
              Pay with MTN MoMo after you submit your order details.
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
              <PhoneInput
                id="phone"
                required
                invalid={!!phoneError}
                country={phoneCountry}
                nationalNumber={phoneNational}
                onCountryChange={(c) => {
                  setPhoneCountry(c);
                  setPhoneError(null);
                }}
                onNationalNumberChange={(v) => {
                  setPhoneNational(v);
                  setPhoneError(null);
                }}
              />
              {phoneError && (
                <p className="mt-1 text-xs text-red-600">{phoneError}</p>
              )}
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
