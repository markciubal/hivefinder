import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireUser } from "@/lib/apiAuth";

/**
 * POST /api/clubs/leave?clubId=...
 *
 * The last officer cannot leave: nothing else in the app can appoint a new
 * one, so the club would be stranded with nobody able to post events or
 * manage members. They have to promote someone first.
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

    const membership = await prisma.member.findFirst({
      where: { userId: auth.userId, clubId },
    });

    if (!membership) {
      return NextResponse.json({ left: true, already: true });
    }

    if (membership.role === "OFFICER") {
      const officerCount = await prisma.member.count({
        where: { clubId, role: "OFFICER" },
      });
      if (officerCount <= 1) {
        return NextResponse.json(
          {
            error:
              "You are the only officer. Promote another member before leaving.",
          },
          { status: 409 }
        );
      }
    }

    // deleteMany also cleans up any duplicate rows the old join route created.
    await prisma.member.deleteMany({
      where: { userId: auth.userId, clubId },
    });

    return NextResponse.json({ left: true });
  } catch (err) {
    console.error("LEAVE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
