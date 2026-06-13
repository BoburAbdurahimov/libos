import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint: shopper leaves an order request from the landing page.
// Price is snapshotted so the influencer's commission stays correct.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.productId || !body?.buyerName || !body?.buyerPhone) {
    return NextResponse.json(
      { error: "productId, buyerName and buyerPhone are required" },
      { status: 400 }
    );
  }
  if (!/^\+?[0-9 ()-]{7,20}$/.test(body.buyerPhone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }
  const bundle = await prisma.bundle.findUnique({
    where: { slug },
    include: { items: true },
  });
  if (!bundle || !bundle.active) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }
  if (!bundle.items.some((i) => i.productId === body.productId)) {
    return NextResponse.json({ error: "Product not in this bundle" }, { status: 400 });
  }
  const product = await prisma.product.findUnique({ where: { id: body.productId } });
  if (!product || !product.inStock) {
    return NextResponse.json({ error: "Product unavailable" }, { status: 409 });
  }
  const order = await prisma.bundleOrder.create({
    data: {
      bundleId: bundle.id,
      productId: product.id,
      buyerName: String(body.buyerName).slice(0, 100),
      buyerPhone: String(body.buyerPhone).slice(0, 20),
      priceAt: product.price,
      currency: product.currency,
    },
  });
  return NextResponse.json({ ok: true, orderId: order.id });
}
