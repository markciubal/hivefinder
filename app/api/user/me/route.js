import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Read user id from Authorization: Bearer <token>
function getUserIdFromRequest(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    // your login route signs { id, username, email }
    return payload.id;
  } catch (err) {
    console.error("JWT verify failed in /api/user/me:", err);
    return null;
  }
}

// GET current profile
export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    username: user.username || "",
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    about: user.about || "",
    interests: user.interests || [], // String[] from your schema
  });
}

// PUT update current profile
export async function PUT(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const data = {
    firstName: body.firstName ?? undefined,
    lastName: body.lastName ?? undefined,
    email: body.email ?? undefined,
    about: body.about ?? undefined,
  };

  if (Array.isArray(body.interests)) {
    data.interests = body.interests;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return NextResponse.json({
    id: updated.id,
    username: updated.username || "",
    email: updated.email || "",
    firstName: updated.firstName || "",
    lastName: updated.lastName || "",
    about: updated.about || "",
    interests: updated.interests || [],
  });
}
