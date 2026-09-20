import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isObjectId,
  notify,
  requireClubOfficer,
  requireUser,
} from "@/lib/apiAuth";
import {
  applyLocationVisibilityAll,
  viewerSharesLocation,
} from "@/lib/locationVisibility";

/**
 * GET /api/events
 *   ?clubId=...   only that club's events
 *   ?scope=upcoming|past|all   (default: upcoming)
 *   ?mine=1       only events from clubs the caller belongs to (needs auth)
 *
 * Reading is public - the directory is browsable without an account, and
 * events are the main reason to look.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get("clubId");
    const scope = searchParams.get("scope") || "upcoming";
    const mine = searchParams.get("mine") === "1";

    const where = {};

    if (clubId) {
      if (!isObjectId(clubId)) {
        return NextResponse.json({ error: "Unknown club." }, { status: 400 });
      }
      where.clubId = clubId;
    }

    const now = new Date();
    if (scope === "upcoming") where.startsAt = { gte: now };
    else if (scope === "past") where.startsAt = { lt: now };

    if (mine) {
      const auth = requireUser(req);
      if (auth.error) return auth.error;

      const memberships = await prisma.member.findMany({
        where: { userId: auth.userId },
        select: { clubId: true },
      });

      const clubIds = memberships.map((m) => m.clubId);
      // No memberships means no events; returning early avoids an `in: []`
      // query that Mongo would answer with everything.
      if (clubIds.length === 0) return NextResponse.json([]);

      where.clubId = clubId ? clubId : { in: clubIds };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startsAt: scope === "past" ? "desc" : "asc" },
      take: 200,
      include: {
        club: { select: { id: true, name: true, kind: true } },
        _count: { select: { interests: true } },
      },
    });

    const canSeeLocation = await viewerSharesLocation(req);
    return NextResponse.json(
      applyLocationVisibilityAll(events, canSeeLocation)
    );
  } catch (err) {
    console.error("EVENT LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/events - officers of the club only.
 *
 * Creating an event notifies every member of that club, which is the whole
 * point of having events attached to clubs rather than floating free.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { clubId, title, description, location, startsAt, endsAt, tags } = body;

    if (!clubId || !isObjectId(clubId)) {
      return NextResponse.json(
        { error: "Pick a club to post this event under." },
        { status: 400 }
      );
    }

    const auth = await requireClubOfficer(req, clubId);
    if (auth.error) return auth.error;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "A title is required." }, { status: 400 });
    }

    const start = new Date(startsAt);
    if (!startsAt || Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "A valid start date and time is required." },
        { status: 400 }
      );
    }

    let end = null;
    if (endsAt) {
      end = new Date(endsAt);
      if (Number.isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "That end time is not a valid date." },
          { status: 400 }
        );
      }
      if (end < start) {
        return NextResponse.json(
          { error: "The event cannot end before it starts." },
          { status: 400 }
        );
      }
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, kind: true },
    });
    if (!club) {
      return NextResponse.json({ error: "Unknown club." }, { status: 404 });
    }

    // Official clubs publish their events through CampusGroups. Accepting one
    // here would create a second, competing calendar for the same club.
    if (club.kind === "OFFICIAL") {
      return NextResponse.json(
        {
          error: `${club.name} posts its events on CampusGroups, not here.`,
          campusGroups: true,
        },
        { status: 409 }
      );
    }

    const event = await prisma.event.create({
      data: {
        clubId,
        title: String(title).trim(),
        description: description || null,
        location: location || null,
        startsAt: start,
        endsAt: end,
        tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
        createdBy: auth.userId,
      },
    });

    // Tell the roster. notify() drops the actor, so the officer who posted it
    // does not get told about their own event.
    const members = await prisma.member.findMany({
      where: { clubId },
      select: { userId: true },
    });

    await notify(
      members.map((m) => m.userId),
      {
        type: "EVENT_CREATED",
        title: `New event: ${event.title}`,
        body: `${club.name} · ${start.toLocaleString()}`,
        href: `/events/${event.id}`,
      },
      { exclude: auth.userId }
    );

    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error("EVENT CREATE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
