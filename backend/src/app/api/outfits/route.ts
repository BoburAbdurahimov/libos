import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const outfits = await prisma.outfit.findMany({
    where: { userId: user.id },
    include: { items: { include: { garment: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ outfits });
}
