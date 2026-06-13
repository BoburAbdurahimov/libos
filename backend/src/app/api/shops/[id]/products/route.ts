import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveImage } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const products = await prisma.product.findMany({
    where: { shopId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

// POST { title, price, category, description?, sizes?, imageBase64?, mediaType? }
// Only the shop owner may add products.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["SELLER"]);
  if (error) return error;
  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  if (shop.ownerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not your shop" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.title || typeof body.price !== "number" || !body?.category) {
    return NextResponse.json(
      { error: "title, price (number) and category are required" },
      { status: 400 }
    );
  }
  let imageUrl: string | null = null;
  if (body.imageBase64) {
    imageUrl = await saveImage(body.imageBase64, body.mediaType ?? "image/jpeg");
  }
  const product = await prisma.product.create({
    data: {
      shopId: shop.id,
      title: body.title,
      description: body.description ?? null,
      price: Math.round(body.price),
      currency: body.currency ?? "UZS",
      category: body.category,
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      imageUrl,
    },
  });
  return NextResponse.json({ product });
}
