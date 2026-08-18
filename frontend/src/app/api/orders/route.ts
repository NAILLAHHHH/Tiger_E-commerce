import { NextResponse } from "next/server";
import { getStrapiUrl } from "@/lib/config";
import { resolveProductImage } from "@/lib/images";
import { isValidE164Phone } from "@/lib/phone";
import { lineTotal, roundMoney } from "@/lib/pricing";
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

  const trimmedPhone = phone.trim();
  if (!isValidE164Phone(trimmedPhone)) {
    return NextResponse.json(
      { error: "Enter a valid phone number with country code" },
      { status: 400 },
    );
  }

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const normalizedItems = items.map((item) => {
    const unitPrice = roundMoney(item.unitPrice);
    const quantity = Math.max(1, Math.round(Number(item.quantity) || 0));
    return {
      ...item,
      unitPrice,
      quantity,
      rowTotal: lineTotal(unitPrice, quantity),
    };
  });

  const subtotal = roundMoney(
    normalizedItems.reduce((sum, item) => sum + item.rowTotal, 0),
  );

  const orderData = {
    customer_name: customer_name.trim(),
    phone: trimmedPhone,
    delivery_address: address?.trim() || null,
    customer_notes: notes?.trim() || null,
    order_status: "placed",
    subtotal,
    total: subtotal,
    what_they_ordered: normalizedItems.map((item) => ({
      product_name: item.name,
      item_code: item.sku,
      size: item.size || null,
      color: item.color || null,
      options_snapshot:
        item.options?.length > 0
          ? item.options
          : [
              ...(item.size ? [{ name: "Size", value: item.size, code: "size" }] : []),
              ...(item.color
                ? [{ name: "Color", value: item.color, code: "color" }]
                : []),
            ],
      how_many: item.quantity,
      price_each: item.unitPrice,
      bought_as: item.pricingMode === "wholesale" ? "many_pieces" : "one_piece",
      row_total: item.rowTotal,
      image_url: resolveProductImage(item.image),
    })),
  };

  const apiUrl = getStrapiUrl().replace(/\/$/, "");

  try {
    const res = await fetch(`${apiUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        typeof json?.error === "string"
          ? json.error
          : json?.error?.message ?? "Failed to place order";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json({
      order_number:
        json.data?.order_reference ?? json.data?.order_number,
      documentId: json.data?.documentId ?? json.data?.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the shop API. Is admin_side_node running on :1338?" },
      { status: 502 },
    );
  }
}
