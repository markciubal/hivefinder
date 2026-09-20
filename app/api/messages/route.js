import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireUser } from "@/lib/apiAuth";
import { blockStatus, blockedMessage } from "@/lib/blocks";

/**
 * GET /api/messages - the caller's inbox.
 *
 * Returns each conversation with the other participant and the last message,
 * newest first, plus an unread count for the bell.
 */
export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const conversations = await prisma.conversation.findMany({
      where: { participantIds: { has: auth.userId } },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, body: true, senderId: true, createdAt: true, readBy: true },
        },
      },
    });

    // Resolve the other participants in one query rather than one per thread.
    const otherIds = [
      ...new Set(
        conversations.flatMap((c) =>
          c.participantIds.filter((id) => id !== auth.userId)
        )
      ),
    ];

    const users = await prisma.user.findMany({
      where: { id: { in: otherIds } },
      select: { id: true, username: true, firstName: true, lastName: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    // Hide threads with people the caller blocked, so a blocked harasser is
    // not the first thing in their inbox. Threads where the *other* person
    // blocked the caller stay: that history is theirs too, it just cannot be
    // replied to. Unblocking brings the thread back.
    const myBlocks = await prisma.block.findMany({
      where: { blockerId: auth.userId },
      select: { blockedId: true },
    });
    const iBlocked = new Set(myBlocks.map((b) => b.blockedId));

    const threads = conversations
      .filter((c) => !c.participantIds.some((id) => iBlocked.has(id)))
      .map((c) => {
      const otherId = c.participantIds.find((id) => id !== auth.userId);
      const last = c.messages[0] || null;
      return {
        id: c.id,
        lastMessageAt: c.lastMessageAt,
        other: byId.get(otherId) || { id: otherId, username: "Unknown" },
        lastMessage: last,
        unread: Boolean(
          last && last.senderId !== auth.userId && !last.readBy.includes(auth.userId)
        ),
      };
    });

    return NextResponse.json({
      threads,
      unreadCount: threads.filter((t) => t.unread).length,
      blockedCount: iBlocked.size,
    });
  } catch (err) {
    console.error("INBOX ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/messages  { toUserId, body }
 *
 * Sends a message, creating the thread on first contact. Returns the
 * conversation id so the client can navigate straight into it.
 */
export async function POST(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const { toUserId, body } = await req.json();

    if (!isObjectId(toUserId)) {
      return NextResponse.json({ error: "Unknown recipient." }, { status: 400 });
    }
    if (toUserId === auth.userId) {
      return NextResponse.json(
        { error: "You cannot message yourself." },
        { status: 400 }
      );
    }

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

    const recipient = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, username: true },
    });
    if (!recipient) {
      return NextResponse.json({ error: "Unknown recipient." }, { status: 404 });
    }

    const block = await blockStatus(auth.userId, toUserId);
    if (block.any) {
      return NextResponse.json(
        { error: blockedMessage(block, recipient.username), blocked: block.byMe ? "byMe" : "byThem" },
        { status: 403 }
      );
    }

    // One thread per pair. `hasEvery` finds it regardless of which order the
    // two ids were stored in.
    let conversation = await prisma.conversation.findFirst({
      where: { participantIds: { hasEvery: [auth.userId, toUserId] } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { participantIds: [auth.userId, toUserId] },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: auth.userId,
        body: text,
        readBy: [auth.userId],
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
    });

    const sender = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { username: true },
    });

    // Notify directly rather than through notify(): the recipient is a single
    // known user and the payload needs the thread link.
    await prisma.notification.create({
      data: {
        userId: toUserId,
        type: "MESSAGE",
        title: `New message from ${sender?.username || "someone"}`,
        body: text.slice(0, 120),
        href: `/messages/${conversation.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      message,
    });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
