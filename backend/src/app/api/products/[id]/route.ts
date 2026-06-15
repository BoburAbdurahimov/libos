import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveImage } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { shop: { select: { name: true, marketName: true, city: true, phone: true } } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

// PATCH { title?, description?, price?, currency?, category?, sizes?, inStock?, imageBase64?, mediaType? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["SELLER"]);
  if (error) return error;
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { shop: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (product.shop.ownerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) ?? {};

  let imageUrl = product.imageUrl;
  if (body.imageBase64) {
    imageUrl = await saveImage(body.imageBase64, body.mediaType ?? "image/jpeg");
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(body.title ? { title: String(body.title) } : {}),
      ...(body.description !== undefined ? { description: body.description ?? null } : {}),
      ...(typeof body.price === "number" ? { price: Math.round(body.price) } : {}),
      ...(body.currency ? { currency: String(body.currency) } : {}),
      ...(body.category ? { category: String(body.category) } : {}),
      ...(Array.isArray(body.sizes) ? { sizes: body.sizes } : {}),
      ...(typeof body.inStock === "boolean" ? { inStock: body.inStock } : {}),
      ...(imageUrl !== product.imageUrl ? { imageUrl } : {}),
    },
  });
  return NextResponse.json({ product: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["SELLER"]);
  if (error) return error;
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { shop: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (product.shop.ownerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
