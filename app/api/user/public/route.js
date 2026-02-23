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

async function isMutualFriend(userId, otherUserId) {
  if (!userId || !otherUserId) return false;

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, recipientId: otherUserId, status: "ACCEPTED" },
        { requesterId: otherUserId, recipientId: userId, status: "ACCEPTED" },
      ],
    },
    select: { id: true },
  });

  return Boolean(friendship);
}

export async function GET(req) {
  const requestUrl = new URL(req.url);
  const userId = requestUrl.searchParams.get("id");
  const viewerId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      contactMethods: {
        where: { visible: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const mutual = await isMutualFriend(viewerId, user.id);

  return NextResponse.json({
    id: user.id,
    username: user.username || user.email.split("@")[0],
    about: mutual ? user.about : null,
    contactMethods: mutual
      ? (user.contactMethods || []).map((method) => ({
          type: method.type,
          value: method.value,
          label: method.label,
          preferred: method.preferred,
        }))
      : [],
  });
}
