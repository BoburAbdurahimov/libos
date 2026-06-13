import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }
  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  return NextResponse.json({
    token: signToken(user),
    user: { id: user.id, email: user.email, name: user.name, role: user.role, handle: user.handle },
  });
}
