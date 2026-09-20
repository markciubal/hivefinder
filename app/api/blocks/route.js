import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireUser } from "@/lib/apiAuth";

/** GET /api/blocks - people the caller has blocked, newest first. */
export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const blocks = await prisma.block.findMany({
      where: { blockerId: auth.userId },
      orderBy: { createdAt: "desc" },
      include: { blocked: { select: { id: true, username: true } } },
    });

    // Only the caller's own blocks. Who has blocked *you* is never exposed.
    return NextResponse.json(
      blocks.map((b) => ({
        id: b.id,
        createdAt: b.createdAt,
        user: b.blocked,
      }))
    );
  } catch (err) {
    console.error("BLOCK LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/blocks  { userId }
 *
 * Idempotent. Also clears the caller's unread message notifications from that
 * person - blocking someone and still having their messages sitting in the
 * bell would defeat the point for exactly the people who need this most.
 */
export async function POST(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const { userId } = await req.json().catch(() => ({}));

    if (!isObjectId(userId)) {
      return NextResponse.json({ error: "Unknown user." }, { status: 400 });
    }
    if (userId === auth.userId) {
      return NextResponse.json(
        { error: "You cannot block yourself." },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Unknown user." }, { status: 404 });
    }

    const existing = await prisma.block.findFirst({
      where: { blockerId: auth.userId, blockedId: userId },
      select: { id: true },
    });

    if (!existing) {
      await prisma.block.create({
        data: { blockerId: auth.userId, blockedId: userId },
      });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { participantIds: { hasEvery: [auth.userId, userId] } },
      select: { id: true },
    });

    if (conversation) {
      await prisma.notification.deleteMany({
        where: {
          userId: auth.userId,
          type: "MESSAGE",
          href: `/messages/${conversation.id}`,
        },
      });
    }

    // Deliberately no notification to the blocked person.
    return NextResponse.json({
      success: true,
      blocked: { id: target.id, username: target.username },
      already: Boolean(existing),
    });
  } catch (err) {
    console.error("BLOCK ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
