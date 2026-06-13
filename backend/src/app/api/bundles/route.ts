import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { randomUUID } from "crypto";

function makeSlug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return `${base || "look"}-${randomUUID().slice(0, 6)}`;
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req, ["INFLUENCER"]);
  if (error) return error;
  const bundles = await prisma.bundle.findMany({
    where: { influencerId: user.id },
    include: {
      items: { include: { product: { include: { shop: { select: { name: true, city: true } } } } } },
      _count: { select: { clicks: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    bundles: bundles.map((b) => ({
      ...b,
      shareUrl: `${process.env.PUBLIC_BASE_URL ?? ""}/b/${b.slug}`,
    })),
  });
}

// POST { title, productIds: string[], description?, commissionPct?, notes?: {productId: note} }
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req, ["INFLUENCER"]);
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (!body?.title || !Array.isArray(body?.productIds) || body.productIds.length === 0) {
    return NextResponse.json(
      { error: "title and productIds are required" },
      { status: 400 }
    );
  }
  const products = await prisma.product.findMany({
    where: { id: { in: body.productIds } },
  });
  if (products.length !== body.productIds.length) {
    return NextResponse.json({ error: "Unknown product in bundle" }, { status: 404 });
  }
  const commissionPct = Math.min(50, Math.max(0, Number(body.commissionPct) || 10));
  const notes: Record<string, string> = body.notes ?? {};

  const bundle = await prisma.bundle.create({
    data: {
      influencerId: user.id,
      slug: makeSlug(body.title),
      title: body.title,
      description: body.description ?? null,
      commissionPct,
      coverImageUrl: products.find((p) => p.imageUrl)?.imageUrl ?? null,
      items: {
        create: products.map((p) => ({
          productId: p.id,
          note: notes[p.id] ?? null,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json({
    bundle: {
      ...bundle,
      shareUrl: `${process.env.PUBLIC_BASE_URL ?? ""}/b/${bundle.slug}`,
    },
  });
}
