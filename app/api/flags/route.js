import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireModerator, requireUser } from "@/lib/apiAuth";

const TARGET_TYPES = ["CLUB", "EVENT", "MESSAGE", "USER"];
const REASONS = [
  "IMPERSONATION",
  "SPAM",
  "HARASSMENT",
  "INAPPROPRIATE",
  "INACCURATE",
  "OTHER",
];
const STATUSES = ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"];

/**
 * Look the reported thing up and describe it, or return null if the reporter
 * has no business referencing it.
 *
 * Messages are the sensitive case: they are private, so a reporter may only
 * flag one from a conversation they are actually part of. Without that check
 * anyone could flag arbitrary message ids and pull another pair's private
 * words into the moderation queue.
 */
async function resolveTarget(targetType, targetId, reporterId) {
  switch (targetType) {
    case "CLUB": {
      const club = await prisma.club.findUnique({
        where: { id: targetId },
        select: { name: true, kind: true },
      });
      return club && { label: `${club.name} (${club.kind === "OFFICIAL" ? "club" : "hive"})` };
    }
    case "EVENT": {
      const event = await prisma.event.findUnique({
        where: { id: targetId },
        select: { title: true, club: { select: { name: true } } },
      });
      return event && { label: `${event.title} — ${event.club.name}` };
    }
    case "USER": {
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        select: { username: true },
      });
      return user && { label: `@${user.username || "unknown"}` };
    }
    case "MESSAGE": {
      const message = await prisma.message.findUnique({
        where: { id: targetId },
        select: {
          body: true,
          senderId: true,
          conversation: { select: { participantIds: true } },
          sender: { select: { username: true } },
        },
      });
      if (!message) return null;
      if (!message.conversation.participantIds.includes(reporterId)) return null;
      // Reporting your own message makes no sense and is a way to seed the
      // queue with text of your choosing.
      if (message.senderId === reporterId) return null;
      return {
        label: `@${message.sender?.username || "unknown"}: "${message.body.slice(0, 160)}"`,
      };
    }
    default:
      return null;
  }
}

/** GET /api/flags?status=OPEN - the moderation queue. Moderators only. */
export async function GET(req) {
  try {
    const auth = requireModerator(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = {};
    if (status && STATUSES.includes(status)) where.status = status;

    const flags = await prisma.flag.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        reporter: { select: { id: true, username: true } },
        resolver: { select: { id: true, username: true } },
      },
    });

    const counts = await prisma.flag.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    return NextResponse.json({
      flags,
      counts: Object.fromEntries(
        counts.map((c) => [c.status, c._count._all])
      ),
    });
  } catch (err) {
    console.error("FLAG LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/flags - report something. Any signed-in user.
 *
 * The unique index on (targetType, targetId, reporterId) makes reporting the
 * same thing twice a no-op rather than a way to flood the queue.
 */
export async function POST(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    // `targetLabel` is deliberately NOT read from the body. It is the evidence
    // a moderator judges on - for a reported message it is the only content
    // they see - so it must come from the database, not from the reporter.
    const { targetType, targetId, reason, details } = await req.json();

    if (!TARGET_TYPES.includes(targetType)) {
      return NextResponse.json({ error: "Unknown target type." }, { status: 400 });
    }
    if (!isObjectId(targetId)) {
      return NextResponse.json({ error: "Unknown target." }, { status: 400 });
    }
    if (!REASONS.includes(reason)) {
      return NextResponse.json({ error: "Pick a reason." }, { status: 400 });
    }

    const target = await resolveTarget(targetType, targetId, auth.userId);
    if (!target) {
      // Same answer for "does not exist" and "not yours to see", so this
      // endpoint cannot be used to probe for private message ids.
      return NextResponse.json({ error: "Unknown target." }, { status: 404 });
    }

    const existing = await prisma.flag.findFirst({
      where: { targetType, targetId, reporterId: auth.userId },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyReported: true,
        flagId: existing.id,
      });
    }

    const flag = await prisma.flag.create({
      data: {
        targetType,
        targetId,
        targetLabel: target.label.slice(0, 200),
        reason,
        details: details ? String(details).slice(0, 2000) : null,
        reporterId: auth.userId,
      },
    });

    // Tell the moderators there is something waiting.
    const moderators = await prisma.user.findMany({
      where: { role: { in: ["SUPERUSER", "MODERATOR"] } },
      select: { id: true },
    });

    if (moderators.length > 0) {
      await prisma.notification.createMany({
        data: moderators
          .filter((m) => m.id !== auth.userId)
          .map((m) => ({
            userId: m.id,
            type: "FLAG_RECEIVED",
            title: `New report: ${reason.toLowerCase()}`,
            body: target.label,
            href: "/moderation",
          })),
      });
    }

    return NextResponse.json({ success: true, flagId: flag.id });
  } catch (err) {
    console.error("FLAG CREATE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
