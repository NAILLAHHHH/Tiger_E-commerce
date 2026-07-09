import { NextResponse } from "next/server";
import { getStrapiUrl } from "@/lib/config";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { documentId } = await context.params;

  if (!documentId?.trim()) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  const strapiUrl = getStrapiUrl().replace(/\/$/, "");

  try {
    const res = await fetch(
      `${strapiUrl}/api/orders/${encodeURIComponent(documentId)}/mark-paid`,
      { method: "POST" },
    );

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        json?.error?.message ?? json?.error ?? "Failed to update order";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json({
      order_status: json.data?.order_status ?? "paid",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Strapi. Is admin_side running?" },
      { status: 502 },
    );
  }
}
