import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { OrderStatus } from "@prisma/client";

const VALID_STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"];

// PATCH { status: "CONFIRMED" | "COMPLETED" | "CANCELLED" }
// SELLER (who owns the product) or ADMIN can update order status.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["SELLER"]);
  if (error) return error;
  const { id } = await params;

  const order = await prisma.bundleOrder.findUnique({
    where: { id },
    include: { product: { include: { shop: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.product.shop.ownerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) ?? {};
  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = await prisma.bundleOrder.update({
    where: { id },
    data: { status: body.status },
  });
  return NextResponse.json({ order: updated });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["SELLER", "INFLUENCER"]);
  if (error) return error;
  const { id } = await params;

  const order = await prisma.bundleOrder.findUnique({
    where: { id },
    include: {
      product: { include: { shop: { select: { name: true, ownerId: true } } } },
      bundle: { select: { slug: true, title: true, influencerId: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isSeller = order.product.shop.ownerId === user.id;
  const isInfluencer = order.bundle.influencerId === user.id;
  if (!isSeller && !isInfluencer && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order });
}
