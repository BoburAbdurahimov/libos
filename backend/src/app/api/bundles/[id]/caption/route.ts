import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateBundleCaptions, aiErrorMessage } from "@/lib/claude";

// POST — AI writes per-network captions for the bundle and caches them
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireUser(req, ["INFLUENCER"]);
  if (error) return error;
  const { id } = await params;
  const bundle = await prisma.bundle.findUnique({
    where: { id },
    include: {
      influencer: { select: { handle: true } },
      items: { include: { product: { include: { shop: { select: { name: true, marketName: true, city: true } } } } } },
    },
  });
  if (!bundle || (bundle.influencerId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const shareUrl = `${process.env.PUBLIC_BASE_URL ?? ""}/b/${bundle.slug}`;
  try {
    const captions = await generateBundleCaptions({
      title: bundle.title,
      description: bundle.description,
      influencerHandle: bundle.influencer.handle,
      shareUrl,
      products: bundle.items.map((i) => ({
        ...i.product,
        shopName: i.product.shop.name,
        marketName: i.product.shop.marketName,
        city: i.product.shop.city,
      })),
    });
    await prisma.bundle.update({
      where: { id },
      data: {
        captionIg: captions.instagram,
        captionTiktok: captions.tiktok,
        captionTg: captions.telegram,
        hashtags: captions.hashtags,
      },
    });
    return NextResponse.json({ captions, shareUrl });
  } catch (err) {
    const { message, status } = aiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
