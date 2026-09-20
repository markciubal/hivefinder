import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireUser } from "@/lib/apiAuth";
import { blockStatus, blockedMessage } from "@/lib/blocks";

/**
 * GET /api/messages/[conversationId] - one thread.
 *
 * Marks everything the caller can see as read as a side effect, which is what
 * clears the bell.
 */
export async function GET(req, { params }) {
  try {
    const { conversationId } = await params;
    if (!isObjectId(conversationId)) {
      return NextResponse.json({ error: "Unknown conversation." }, { status: 400 });
    }

    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    // 404 rather than 403 for a thread you are not in: confirming that a
    // conversation exists between two other people is itself a leak.
    if (!conversation || !conversation.participantIds.includes(auth.userId)) {
      return NextResponse.json({ error: "Unknown conversation." }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    const otherId = conversation.participantIds.find((id) => id !== auth.userId);
    const other = await prisma.user.findUnique({
      where: { id: otherId },
      select: { id: true, username: true, firstName: true, lastName: true },
    });

    const unreadIds = messages
      .filter((m) => m.senderId !== auth.userId && !m.readBy.includes(auth.userId))
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { readBy: { push: auth.userId } },
      });
    }

    const block = await blockStatus(auth.userId, otherId);

    return NextResponse.json({
      id: conversation.id,
      other: other || { id: otherId, username: "Unknown" },
      messages,
      // byThem is exposed as a plain "can't reply" flag; the UI words it
      // neutrally rather than announcing "they blocked you".
      block: { byMe: block.byMe, byThem: block.byThem },
    });
  } catch (err) {
    console.error("THREAD ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST /api/messages/[conversationId] - reply in an existing thread. */
export async function POST(req, { params }) {
  try {
    const { conversationId } = await params;
    if (!isObjectId(conversationId)) {
      return NextResponse.json({ error: "Unknown conversation." }, { status: 400 });
    }

    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation || !conversation.participantIds.includes(auth.userId)) {
      return NextResponse.json({ error: "Unknown conversation." }, { status: 404 });
    }

    const replyTo = conversation.participantIds.find((id) => id !== auth.userId);
    const block = await blockStatus(auth.userId, replyTo);
    if (block.any) {
      return NextResponse.json(
        { error: blockedMessage(block), blocked: block.byMe ? "byMe" : "byThem" },
        { status: 403 }
      );
    }

    const { body } = await req.json();
    const text = String(body || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Write something first." }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json(
        { error: "That message is too long (4000 characters max)." },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: auth.userId,
        body: text,
        readBy: [auth.userId],
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    const otherId = conversation.participantIds.find((id) => id !== auth.userId);
    const sender = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { username: true },
    });

    if (otherId) {
      await prisma.notification.create({
        data: {
          userId: otherId,
          type: "MESSAGE",
          title: `New message from ${sender?.username || "someone"}`,
          body: text.slice(0, 120),
          href: `/messages/${conversationId}`,
        },
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("REPLY ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
