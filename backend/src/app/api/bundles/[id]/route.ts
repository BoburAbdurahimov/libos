import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// GET — bundle detail with analytics: clicks by source, orders, earned commission
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["INFLUENCER"]);
  if (error) return error;
  const { id } = await params;
  const bundle = await prisma.bundle.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { shop: { select: { name: true, marketName: true, city: true, phone: true } } } } } },
      orders: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!bundle || (bundle.influencerId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const clicks = await prisma.bundleClick.groupBy({
    by: ["source"],
    where: { bundleId: id },
    _count: { _all: true },
  });
  const completed = bundle.orders.filter((o) => o.status === "COMPLETED");
  const commissionEarned = Math.round(
    completed.reduce((sum, o) => sum + (o.priceAt * bundle.commissionPct) / 100, 0)
  );
  return NextResponse.json({
    bundle: {
      ...bundle,
      shareUrl: `${process.env.PUBLIC_BASE_URL ?? ""}/b/${bundle.slug}`,
    },
    stats: {
      clicksBySource: Object.fromEntries(
        clicks.map((c) => [c.source ?? "other", c._count._all])
      ),
      totalClicks: clicks.reduce((s, c) => s + c._count._all, 0),
      totalOrders: bundle.orders.length,
      completedOrders: completed.length,
      commissionEarned,
      currency: bundle.orders[0]?.currency ?? "UZS",
    },
  });
}

// PATCH { active?, title?, description?, commissionPct? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["INFLUENCER"]);
  if (error) return error;
  const { id } = await params;
  const bundle = await prisma.bundle.findUnique({ where: { id } });
  if (!bundle || (bundle.influencerId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await req.json().catch(() => ({}))) ?? {};
  const updated = await prisma.bundle.update({
    where: { id },
    data: {
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
      ...(body.title ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(typeof body.commissionPct === "number"
        ? { commissionPct: Math.min(50, Math.max(0, body.commissionPct)) }
        : {}),
    },
  });
  return NextResponse.json({ bundle: updated });
}
