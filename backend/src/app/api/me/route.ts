import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req);
  if (error) return error;
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    handle: user.handle,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  });
}
