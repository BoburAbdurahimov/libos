import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Role, User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET;

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: { id: string; role: Role }) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

export async function getUserFromRequest(
  req: NextRequest
): Promise<User | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { sub: string };
    return prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

export async function requireUser(req: NextRequest, roles?: Role[]) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (roles && !roles.includes(user.role) && user.role !== "ADMIN") {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user, error: null };
}
