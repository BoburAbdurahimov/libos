import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city") ?? undefined;
  const shops = await prisma.shop.findMany({
    where: city ? { city: { equals: city, mode: "insensitive" } } : undefined,
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ shops });
}

// POST { name, city, phone, marketName?, description? } — SELLER only
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req, ["SELLER"]);
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.city || !body?.phone) {
    return NextResponse.json(
      { error: "name, city and phone are required" },
      { status: 400 }
    );
  }
  const shop = await prisma.shop.create({
    data: {
      ownerId: user.id,
      name: body.name,
      city: body.city,
      phone: body.phone,
      marketName: body.marketName ?? null,
      description: body.description ?? null,
    },
  });
  return NextResponse.json({ shop });
}
