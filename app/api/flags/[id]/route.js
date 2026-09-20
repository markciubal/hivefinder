import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireModerator } from "@/lib/apiAuth";

const STATUSES = ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"];

/**
 * PATCH /api/flags/[id]  { status, resolutionNote }
 *
 * Move a report through the queue. The reporter is told when it closes -
 * reporting into silence is why people stop reporting.
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ error: "Unknown report." }, { status: 400 });
    }

    const auth = requireModerator(req);
    if (auth.error) return auth.error;

    const { status, resolutionNote } = await req.json();
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }

    const existing = await prisma.flag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Unknown report." }, { status: 404 });
    }

    const closing = status === "RESOLVED" || status === "DISMISSED";

    const flag = await prisma.flag.update({
      where: { id },
      data: {
        status,
        resolutionNote: resolutionNote
          ? String(resolutionNote).slice(0, 2000)
          : existing.resolutionNote,
        resolvedById: closing ? auth.userId : null,
        resolvedAt: closing ? new Date() : null,
      },
    });

    // Only announce a transition into a closed state, so re-saving a note does
    // not spam the reporter.
    const wasClosed =
      existing.status === "RESOLVED" || existing.status === "DISMISSED";

    if (closing && !wasClosed && existing.reporterId !== auth.userId) {
      await prisma.notification.create({
        data: {
          userId: existing.reporterId,
          type: "FLAG_RESOLVED",
          title:
            status === "RESOLVED"
              ? "Your report was actioned"
              : "Your report was reviewed",
          body:
            resolutionNote ||
            (status === "RESOLVED"
              ? "Thanks - a moderator took action."
              : "A moderator looked into it and took no action."),
          href: null,
        },
      });
    }

    return NextResponse.json({ success: true, flag });
  } catch (err) {
    console.error("FLAG UPDATE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
