import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, notify, requireUser } from "@/lib/apiAuth";

/**
 * POST /api/clubs/join?clubId=...
 *
 * Idempotent: joining a club you already belong to returns success without a
 * second Member row. The old route inserted unconditionally, so a double-click
 * made someone a member twice and they then had to "leave" twice.
 */
export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get("clubId");

    if (!isObjectId(clubId)) {
      return NextResponse.json({ error: "Unknown club." }, { status: 400 });
    }

    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, kind: true },
    });
    if (!club) {
      return NextResponse.json({ error: "Unknown club." }, { status: 404 });
    }

    // Membership of a recognized organization is held by the university on
    // CampusGroups. HiveFinder is only a directory for those, so it must not
    // mint a membership that the university has no record of.
    if (club.kind === "OFFICIAL") {
      return NextResponse.json(
        {
          error: `${club.name} is an official Sacramento State club. Join it on CampusGroups.`,
          campusGroups: true,
        },
        { status: 409 }
      );
    }

    const existing = await prisma.member.findFirst({
      where: { userId: auth.userId, clubId },
      select: { id: true, role: true },
    });
    if (existing) {
      return NextResponse.json({ joined: true, role: existing.role, already: true });
    }

    await prisma.member.create({
      data: { userId: auth.userId, clubId, role: "MEMBER" },
    });

    // Let the officers know someone new arrived.
    const officers = await prisma.member.findMany({
      where: { clubId, role: "OFFICER" },
      select: { userId: true },
    });

    await notify(
      officers.map((o) => o.userId),
      {
        type: "CLUB_JOINED",
        title: `${auth.claims?.username || "Someone"} joined ${club.name}`,
        href: `/clubs/${clubId}/members`,
      },
      { exclude: auth.userId }
    );

    return NextResponse.json({ joined: true, role: "MEMBER" });
  } catch (err) {
    console.error("JOIN ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
