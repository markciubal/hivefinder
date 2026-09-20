import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireUser } from "@/lib/apiAuth";

/**
 * POST /api/notifications/read  { ids?: string[], all?: boolean }
 *
 * Marks notifications read. The where-clause is always scoped to the caller,
 * so passing someone else's ids marks nothing rather than erroring - there is
 * no way to probe for another user's notification ids.
 */
export async function POST(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const { ids, all } = await req.json().catch(() => ({}));

    const where = { userId: auth.userId, readAt: null };

    if (!all) {
      const valid = Array.isArray(ids) ? ids.filter(isObjectId) : [];
      if (valid.length === 0) {
        return NextResponse.json({ success: true, updated: 0 });
      }
      where.id = { in: valid };
    }

    const result = await prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: auth.userId, readAt: null },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      unreadCount,
    });
  } catch (err) {
    console.error("NOTIFICATION READ ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
