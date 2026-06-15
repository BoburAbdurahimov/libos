import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// GET /api/orders
// SELLER   → orders for products in their shops (optionally ?status=NEW|CONFIRMED|...)
// INFLUENCER → orders placed on their bundles
// ADMIN    → all orders
export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req, ["SELLER", "INFLUENCER"]);
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const statusFilter = status ? { status: status as never } : {};

  if (user.role === "SELLER" || user.role === "ADMIN") {
    const orders = await prisma.bundleOrder.findMany({
      where: {
        ...statusFilter,
        product: { shop: { ownerId: user.role === "ADMIN" ? undefined : user.id } },
      },
      include: {
        product: { select: { title: true, shop: { select: { name: true } } } },
        bundle: { select: { slug: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ orders });
  }

  // INFLUENCER — orders on their bundles
  const orders = await prisma.bundleOrder.findMany({
    where: {
      ...statusFilter,
      bundle: { influencerId: user.id },
    },
    include: {
      product: { select: { title: true, shop: { select: { name: true } } } },
      bundle: { select: { slug: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ orders });
}
