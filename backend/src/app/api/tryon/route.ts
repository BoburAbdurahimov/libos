import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { tryOnProvider } from "@/lib/tryon";

// POST { garmentIds?: string[], productIds?: string[] }
// Renders a try-on preview from wardrobe items and/or market products.
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const body = (await req.json().catch(() => ({}))) ?? {};

  const itemImageUrls: string[] = [];
  if (Array.isArray(body.garmentIds) && body.garmentIds.length) {
    const garments = await prisma.garment.findMany({
      where: { id: { in: body.garmentIds }, userId: user.id },
    });
    itemImageUrls.push(...garments.map((g) => g.imageUrl));
  }
  if (Array.isArray(body.productIds) && body.productIds.length) {
    const products = await prisma.product.findMany({
      where: { id: { in: body.productIds } },
    });
    itemImageUrls.push(...products.map((p) => p.imageUrl).filter((u): u is string => !!u));
  }
  if (!itemImageUrls.length) {
    return NextResponse.json(
      { error: "Provide garmentIds or productIds" },
      { status: 400 }
    );
  }

  const result = await tryOnProvider.render({
    personImageUrl: user.avatarUrl ?? undefined,
    itemImageUrls,
  });
  return NextResponse.json(result);
}
