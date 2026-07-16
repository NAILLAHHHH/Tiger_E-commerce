import { NextResponse } from "next/server";
import { submitReview } from "@/lib/reviews";

type Body = {
  productId?: string;
  customerName?: string;
  stars?: number;
  title?: string;
  comment?: string;
};

export async function POST(request: Request) {
  let body: Body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const productId = body.productId?.trim();
  const customerName = body.customerName?.trim();
  const comment = body.comment?.trim();
  const stars = Number(body.stars);
  const title = body.title?.trim();

  if (!productId || !customerName || !comment) {
    return NextResponse.json(
      { error: "Name, product, and review text are required" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return NextResponse.json(
      { error: "Please choose a rating from 1 to 5 stars" },
      { status: 400 },
    );
  }

  if (comment.length < 10) {
    return NextResponse.json(
      { error: "Please write at least 10 characters" },
      { status: 400 },
    );
  }

  try {
    const review = await submitReview({
      productId,
      customerName,
      stars,
      title,
      comment,
    });
    return NextResponse.json({ review });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
