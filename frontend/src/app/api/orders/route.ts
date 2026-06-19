import { NextResponse } from "next/server";
import { getStrapiUrl } from "@/lib/config";
import type { CartItem } from "@/types/database";

type CheckoutBody = {
  customer_name: string;
  phone: string;
  address?: string;
  notes?: string;
  items: CartItem[];
};

export async function POST(request: Request) {
  let body: CheckoutBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { customer_name, phone, address, notes, items } = body;

  if (!customer_name?.trim() || !phone?.trim()) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 },
    );
  }

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const orderData = {
    customer_name: customer_name.trim(),
    phone: phone.trim(),
    address: address?.trim() || null,
    notes: notes?.trim() || null,
    status: "pending_contact",
    subtotal,
    total: subtotal,
    items: items.map((item) => ({
      product_id: item.productId,
      variant_id: item.variantId,
      product_name: item.name,
      product_slug: item.slug,
      sku: item.sku,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      pricing_mode: item.pricingMode,
      line_total: item.unitPrice * item.quantity,
    })),
  };

  const strapiUrl = getStrapiUrl().replace(/\/$/, "");

  try {
    const res = await fetch(`${strapiUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: orderData }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        json?.error?.message ?? json?.error ?? "Failed to place order";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json({
      order_number: json.data?.order_number,
      documentId: json.data?.documentId,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Strapi. Is admin_side running?" },
      { status: 502 },
    );
  }
}
