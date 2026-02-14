import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUserIdFromRequest(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

function formatUser(user) {
  return {
    ...user,
    username: user.username || user.email.split("@")[0],
  };
}

export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      about: true,
      interests: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(formatUser(user));
}

export async function PUT(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    email,
    firstName,
    lastName,
    about,
    interests,
  } = body || {};

  if (typeof email === "string" && !email.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const updateData = {};

  if (typeof email === "string") {
    updateData.email = email.trim().toLowerCase();
  }
  if (typeof firstName === "string") {
    updateData.firstName = firstName.trim() || null;
  }
  if (typeof lastName === "string") {
    updateData.lastName = lastName.trim() || null;
  }
  if (typeof about === "string") {
    updateData.about = about.trim() || null;
  }
  if (Array.isArray(interests)) {
    updateData.interests = interests
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        about: true,
        interests: true,
        role: true,
      },
    });

    return NextResponse.json(formatUser(user));
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    console.error("[user/me PUT]", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
