import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ shop });
}

// PATCH { name?, city?, phone?, marketName?, description? } — SELLER (owner) only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["SELLER"]);
  if (error) return error;
  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (shop.ownerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) ?? {};
  const updated = await prisma.shop.update({
    where: { id },
    data: {
      ...(body.name ? { name: String(body.name) } : {}),
      ...(body.city ? { city: String(body.city) } : {}),
      ...(body.phone ? { phone: String(body.phone) } : {}),
      ...(body.marketName !== undefined ? { marketName: body.marketName ?? null } : {}),
      ...(body.description !== undefined ? { description: body.description ?? null } : {}),
    },
  });
  return NextResponse.json({ shop: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["SELLER"]);
  if (error) return error;
  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (shop.ownerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.shop.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
