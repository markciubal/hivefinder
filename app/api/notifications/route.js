import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";

/**
 * GET /api/notifications?unread=1&limit=20
 *
 * Backs the header bell. Always returns unreadCount so the badge is correct
 * even when the list is truncated.
 */
export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "1";
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

    const where = { userId: auth.userId };
    if (unreadOnly) where.readAt = null;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: auth.userId, readAt: null },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("NOTIFICATION LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
