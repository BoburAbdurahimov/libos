import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveImage } from "@/lib/storage";
import { tagGarment, aiErrorMessage } from "@/lib/claude";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const garments = await prisma.garment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ garments });
}

// POST { imageBase64, mediaType } — stores the photo and AI-tags it
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body?.imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }
  const mediaType = ["image/jpeg", "image/png", "image/webp"].includes(body.mediaType)
    ? body.mediaType
    : "image/jpeg";

  let tags;
  try {
    tags = await tagGarment(body.imageBase64, mediaType);
  } catch (err) {
    const { message, status } = aiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }

  const imageUrl = await saveImage(body.imageBase64, mediaType);
  const garment = await prisma.garment.create({
    data: {
      userId: user.id,
      imageUrl,
      category: tags.category,
      subcategory: tags.subcategory,
      colors: tags.colors,
      styleTags: tags.styleTags,
      season: tags.season,
      aiDescription: tags.description,
    },
  });
  return NextResponse.json({ garment });
}
