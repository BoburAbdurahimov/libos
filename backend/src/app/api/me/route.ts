import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveImage } from "@/lib/storage";

function publicUser(u: {
  id: string; email: string; name: string; role: string;
  handle: string | null; bio: string | null; avatarUrl: string | null;
}) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, handle: u.handle, bio: u.bio, avatarUrl: u.avatarUrl };
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  return NextResponse.json(publicUser(user));
}

// PATCH { name?, bio?, handle?, avatarBase64?, avatarMediaType? }
export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  const body = (await req.json().catch(() => ({}))) ?? {};

  let avatarUrl = user.avatarUrl;
  if (body.avatarBase64) {
    avatarUrl = await saveImage(
      body.avatarBase64,
      ["image/jpeg", "image/png", "image/webp"].includes(body.avatarMediaType)
        ? body.avatarMediaType
        : "image/jpeg"
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(body.name ? { name: String(body.name).slice(0, 100) } : {}),
      ...(body.bio !== undefined ? { bio: String(body.bio).slice(0, 500) } : {}),
      ...(user.role === "INFLUENCER" && body.handle !== undefined
        ? { handle: body.handle ? String(body.handle).slice(0, 50) : null }
        : {}),
      ...(avatarUrl !== user.avatarUrl ? { avatarUrl } : {}),
    },
  });
  return NextResponse.json(publicUser(updated));
}
