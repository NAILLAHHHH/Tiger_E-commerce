import { getStrapiUrl } from "@/lib/config";

export type OrderLineItem = {
  product_name: string;
  size: string | null;
  color: string | null;
  item_code: string | null;
  how_many: number;
  price_each: number;
  bought_as: string;
  row_total: number;
  image_url: string | null;
};

export type OrderSummary = {
  order_reference: string | null;
  customer_name: string | null;
  phone: string | null;
  delivery_address: string | null;
  customer_notes: string | null;
  order_status: string;
  subtotal: number;
  total: number;
  what_they_ordered: OrderLineItem[];
  createdAt: string | null;
};

export function orderSummaryPath(orderReference: string): string {
  return `/order/${encodeURIComponent(orderReference)}`;
}

/** Origin for shareable order links — localhost always uses http (no SSL in dev). */
export function getPublicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://127.0.0.1${port ? `:${port}` : ""}`;
    }
    return window.location.origin;
  }

  return "http://127.0.0.1:3000";
}

export function orderSummaryUrl(
  orderReference: string,
  origin?: string,
): string {
  let base = (origin ?? getPublicSiteOrigin()).replace(/\/$/, "");

  // Local share links: always http + 127.0.0.1
  const localMatch = base.match(
    /^(?:https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i,
  );
  if (localMatch) {
    base = `http://127.0.0.1${localMatch[2] ?? ""}`;
  }

  return `${base}${orderSummaryPath(orderReference)}`;
}

export async function getOrderByReference(
  reference: string,
): Promise<OrderSummary | null> {
  const trimmed = reference.trim();
  if (!trimmed) return null;

  const base = getStrapiUrl().replace(/\/$/, "");
  const url = `${base}/api/orders/by-reference/${encodeURIComponent(trimmed)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 15 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: OrderSummary | null };
    return json.data ?? null;
  } catch {
    return null;
  }
}
