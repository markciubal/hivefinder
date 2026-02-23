// app/api/friends/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { friendFinderSampleFriends } from '@/lib/friendFinderSampleData';
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

function buildFriendMap(friendships, userId) {
  const map = new Map();
  friendships.forEach((friendship) => {
    const isRequester = friendship.requesterId === userId;
    const otherId = isRequester ? friendship.recipientId : friendship.requesterId;
    map.set(otherId, {
      status: friendship.status,
      direction: isRequester ? "outgoing" : "incoming",
    });
  });
  return map;
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const demoParam = requestUrl.searchParams.get('demo');
  if (demoParam === '1' || demoParam === 'true') {
    return NextResponse.json(
      friendFinderSampleFriends.map((friend) => ({
        ...friend,
        contactMethods: friend.contactMethods || [],
        isFriend: false,
        friendStatus: "none",
      }))
    );
  }

  const userId = getUserIdFromRequest(request);
  const friendships = userId
    ? await prisma.friendship.findMany({
        where: {
          OR: [{ requesterId: userId }, { recipientId: userId }],
        },
        select: {
          requesterId: true,
          recipientId: true,
          status: true,
        },
      })
    : [];
  const friendMap = buildFriendMap(friendships, userId);

  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: { club: true },
      },
      contactMethods: {
        where: { visible: true },
      },
    },
    take: 500,
  });

  const shaped = users.map((u) => ({
    id: u.id,
    username: u.username || u.email.split('@')[0],
    interests: u.interests || [], // from schema, can be empty until account page UI
    memberships: (u.memberships || []).map((m) => ({
      club: m.club?.name || '',
    })),
    about:
      userId && friendMap.get(u.id)?.status === "ACCEPTED"
        ? u.about
        : null,
    contactMethods:
      userId && friendMap.get(u.id)?.status === "ACCEPTED"
        ? (u.contactMethods || []).map((method) => ({
            type: method.type,
            value: method.value,
            label: method.label,
            preferred: method.preferred,
            visible: method.visible,
          }))
        : [],
    isFriend: userId ? friendMap.get(u.id)?.status === "ACCEPTED" : false,
    friendStatus: userId
      ? friendMap.get(u.id)?.status === "ACCEPTED"
        ? "accepted"
        : friendMap.get(u.id)?.status === "PENDING"
          ? friendMap.get(u.id)?.direction
          : friendMap.get(u.id)?.status === "REJECTED"
            ? "rejected"
            : "none"
      : "none",
  }));

  return NextResponse.json(shaped);
}

export async function POST(request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const friendId = typeof body?.friendId === "string" ? body.friendId : "";

  if (!friendId) {
    return NextResponse.json({ error: "friendId is required" }, { status: 400 });
  }
  if (friendId === userId) {
    return NextResponse.json(
      { error: "Cannot add yourself as a friend" },
      { status: 400 }
    );
  }

  const friendExists = await prisma.user.findUnique({
    where: { id: friendId },
    select: { id: true },
  });

  if (!friendExists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, recipientId: friendId },
          { requesterId: friendId, recipientId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return NextResponse.json({ success: true, status: "accepted" });
      }
      if (existing.status === "PENDING") {
        if (existing.requesterId === userId) {
          return NextResponse.json({ success: true, status: "pending" });
        }
        const updated = await prisma.friendship.update({
          where: { id: existing.id },
          data: { status: "ACCEPTED" },
        });
        return NextResponse.json({ success: true, status: updated.status });
      }

      const updated = await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId: userId,
          recipientId: friendId,
          status: "PENDING",
        },
      });
      return NextResponse.json({ success: true, status: updated.status });
    }

    const created = await prisma.friendship.create({
      data: {
        requesterId: userId,
        recipientId: friendId,
        status: "PENDING",
      },
    });
    return NextResponse.json({ success: true, status: created.status });
  } catch (error) {
    console.error("[friends POST]", error);
    return NextResponse.json(
      { error: "Failed to add friend request" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, status: "pending" });
}

export async function PATCH(request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const friendId = typeof body?.friendId === "string" ? body.friendId : "";
  const action = typeof body?.action === "string" ? body.action : "";

  if (!friendId || !["accept", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "friendId and valid action are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      requesterId: friendId,
      recipientId: userId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Friend request not found" },
      { status: 404 }
    );
  }

  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: "Friend request already resolved" },
      { status: 400 }
    );
  }

  const updated = await prisma.friendship.update({
    where: { id: existing.id },
    data: { status: action === "accept" ? "ACCEPTED" : "REJECTED" },
  });

  return NextResponse.json({ success: true, status: updated.status });
}
