import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { suggestOutfits, aiErrorMessage } from "@/lib/claude";

// POST { occasion?, weather?, save? } — AI composes outfits from the wardrobe
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const body = (await req.json().catch(() => ({}))) ?? {};

  const garments = await prisma.garment.findMany({ where: { userId: user.id } });
  if (garments.length < 2) {
    return NextResponse.json(
      { error: "Add at least 2 items to your wardrobe first" },
      { status: 400 }
    );
  }

  let suggestions;
  try {
    suggestions = await suggestOutfits(garments, {
      occasion: body.occasion,
      weather: body.weather,
    });
  } catch (err) {
    const { message, status } = aiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }

  if (body.save) {
    for (const s of suggestions) {
      await prisma.outfit.create({
        data: {
          userId: user.id,
          name: s.name,
          occasion: s.occasion,
          aiFeedback: s.rationale,
          items: { create: s.garmentIds.map((garmentId) => ({ garmentId })) },
        },
      });
    }
  }

  const byId = new Map(garments.map((g) => [g.id, g]));
  return NextResponse.json({
    outfits: suggestions.map((s) => ({
      ...s,
      garments: s.garmentIds.map((id) => byId.get(id)),
    })),
  });
}
