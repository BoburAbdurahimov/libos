import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const { id } = await params;
  const garment = await prisma.garment.findUnique({ where: { id } });
  if (!garment || garment.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.garment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
