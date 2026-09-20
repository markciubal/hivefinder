import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, notify, requireClubOfficer, requireUser } from "@/lib/apiAuth";
import {
  applyLocationVisibility,
  viewerSharesLocation,
} from "@/lib/locationVisibility";

/** GET /api/events/[id] - public. */
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ error: "Unknown event." }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        club: { select: { id: true, name: true, kind: true } },
        creator: { select: { id: true, username: true } },
        _count: { select: { interests: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Unknown event." }, { status: 404 });
    }

    // Tell the caller whether they have already marked interest, so the button
    // renders in the right state on first paint.
    let viewerInterested = false;
    const auth = requireUser(req);
    if (!auth.error) {
      const row = await prisma.eventInterest.findFirst({
        where: { eventId: id, userId: auth.userId },
        select: { id: true },
      });
      viewerInterested = Boolean(row);
    }

    const canSeeLocation = await viewerSharesLocation(req);
    return NextResponse.json(
      applyLocationVisibility({ ...event, viewerInterested }, canSeeLocation)
    );
  } catch (err) {
    console.error("EVENT GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PATCH /api/events/[id] - officers of the owning club. */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ error: "Unknown event." }, { status: 400 });
    }

    const existing = await prisma.event.findUnique({
      where: { id },
      select: { id: true, clubId: true, title: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Unknown event." }, { status: 404 });
    }

    const auth = await requireClubOfficer(req, existing.clubId);
    if (auth.error) return auth.error;

    const body = await req.json();
    const data = {};

    if (body.title !== undefined) {
      if (!String(body.title).trim()) {
        return NextResponse.json(
          { error: "A title is required." },
          { status: 400 }
        );
      }
      data.title = String(body.title).trim();
    }
    if (body.description !== undefined) data.description = body.description || null;
    if (body.location !== undefined) data.location = body.location || null;
    if (body.tags !== undefined) {
      data.tags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : [];
    }

    if (body.startsAt !== undefined) {
      const start = new Date(body.startsAt);
      if (Number.isNaN(start.getTime())) {
        return NextResponse.json(
          { error: "That start time is not a valid date." },
          { status: 400 }
        );
      }
      data.startsAt = start;
    }

    if (body.endsAt !== undefined) {
      if (!body.endsAt) {
        data.endsAt = null;
      } else {
        const end = new Date(body.endsAt);
        if (Number.isNaN(end.getTime())) {
          return NextResponse.json(
            { error: "That end time is not a valid date." },
            { status: 400 }
          );
        }
        data.endsAt = end;
      }
    }

    const event = await prisma.event.update({ where: { id }, data });
    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error("EVENT PATCH ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[id] - officers of the owning club.
 *
 * Cancels rather than hard-deletes when anyone has marked interest: those
 * people were told the event exists, so they should be told it is off. A
 * silently vanishing event is worse than a cancelled one.
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ error: "Unknown event." }, { status: 400 });
    }

    const existing = await prisma.event.findUnique({
      where: { id },
      include: {
        club: { select: { name: true } },
        interests: { select: { userId: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Unknown event." }, { status: 404 });
    }

    const auth = await requireClubOfficer(req, existing.clubId);
    if (auth.error) return auth.error;

    if (existing.interests.length > 0) {
      await prisma.event.update({
        where: { id },
        data: { cancelledAt: new Date() },
      });

      await notify(
        existing.interests.map((i) => i.userId),
        {
          type: "EVENT_CANCELLED",
          title: `Cancelled: ${existing.title}`,
          body: `${existing.club.name} cancelled this event.`,
          href: `/events/${id}`,
        },
        { exclude: auth.userId }
      );

      return NextResponse.json({ success: true, cancelled: true });
    }

    // Nobody was watching - remove it outright.
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (err) {
    console.error("EVENT DELETE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
