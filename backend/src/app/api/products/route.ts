import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public catalog with simple filters: ?category=&city=&q=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category") ?? undefined;
  const city = sp.get("city") ?? undefined;
  const q = sp.get("q") ?? undefined;

  const products = await prisma.product.findMany({
    where: {
      inStock: true,
      ...(category ? { category } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(city ? { shop: { city: { equals: city, mode: "insensitive" } } } : {}),
    },
    include: { shop: { select: { name: true, marketName: true, city: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ products });
}
