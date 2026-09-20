import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireUser } from "@/lib/apiAuth";

/**
 * POST /api/events/[id]/interest - toggle the caller's "I'm interested".
 *
 * Idempotent in both directions: the unique index on (eventId, userId) means a
 * double-click cannot create two rows, and un-marking something you never
 * marked is a no-op rather than an error.
 */
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ error: "Unknown event." }, { status: 400 });
    }

    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Unknown event." }, { status: 404 });
    }

    const existing = await prisma.eventInterest.findFirst({
      where: { eventId: id, userId: auth.userId },
      select: { id: true },
    });

    if (existing) {
      await prisma.eventInterest.delete({ where: { id: existing.id } });
    } else {
      await prisma.eventInterest.create({
        data: { eventId: id, userId: auth.userId },
      });
    }

    const count = await prisma.eventInterest.count({ where: { eventId: id } });

    return NextResponse.json({ interested: !existing, count });
  } catch (err) {
    console.error("EVENT INTEREST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
