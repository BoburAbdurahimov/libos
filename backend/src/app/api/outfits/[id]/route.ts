import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const { id } = await params;
  const outfit = await prisma.outfit.findUnique({
    where: { id },
    include: { items: { include: { garment: true } } },
  });
  if (!outfit || outfit.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ outfit });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const { id } = await params;
  const outfit = await prisma.outfit.findUnique({ where: { id } });
  if (!outfit || outfit.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.outfit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
