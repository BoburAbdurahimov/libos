import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

const ALLOWED_ROLES = ["USER", "INFLUENCER", "SELLER"] as const;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.name) {
    return NextResponse.json(
      { error: "email, password and name are required" },
      { status: 400 }
    );
  }
  const role = ALLOWED_ROLES.includes(body.role) ? body.role : "USER";
  if (body.password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  const existing = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  if (body.handle) {
    const handleTaken = await prisma.user.findUnique({
      where: { handle: body.handle },
    });
    if (handleTaken) {
      return NextResponse.json({ error: "Handle already taken" }, { status: 409 });
    }
  }
  const user = await prisma.user.create({
    data: {
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      name: body.name,
      role,
      handle: role === "INFLUENCER" ? (body.handle ?? null) : null,
    },
  });
  return NextResponse.json({
    token: signToken(user),
    user: { id: user.id, email: user.email, name: user.name, role: user.role, handle: user.handle },
  });
}
