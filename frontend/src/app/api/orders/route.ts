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
    delivery_address: address?.trim() || null,
    customer_notes: notes?.trim() || null,
    order_status: "placed",
    subtotal,
    total: subtotal,
    what_they_ordered: items.map((item) => ({
      product_name: item.name,
      item_code: item.sku,
      size: item.size,
      color: item.color,
      how_many: item.quantity,
      price_each: item.unitPrice,
      bought_as: item.pricingMode === "wholesale" ? "many_pieces" : "one_piece",
      row_total: item.unitPrice * item.quantity,
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
      order_number:
        json.data?.order_reference ?? json.data?.order_number,
      documentId: json.data?.documentId,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Strapi. Is admin_side running?" },
      { status: 502 },
    );
  }
}
