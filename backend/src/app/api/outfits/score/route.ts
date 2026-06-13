import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { scoreOutfit, aiErrorMessage } from "@/lib/claude";

// POST { garmentIds: string[] } — AI scores the combination 0-100
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.garmentIds) || body.garmentIds.length < 2) {
    return NextResponse.json(
      { error: "garmentIds must contain at least 2 items" },
      { status: 400 }
    );
  }
  const garments = await prisma.garment.findMany({
    where: { id: { in: body.garmentIds }, userId: user.id },
  });
  if (garments.length !== body.garmentIds.length) {
    return NextResponse.json({ error: "Unknown garment in selection" }, { status: 404 });
  }
  try {
    const result = await scoreOutfit(garments);
    return NextResponse.json(result);
  } catch (err) {
    const { message, status } = aiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
