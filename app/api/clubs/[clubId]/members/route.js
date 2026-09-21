import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireUser } from "@/lib/apiAuth";
import { hiddenUserIds } from "@/lib/blocks";

/**
 * GET /api/clubs/[clubId]/members
 *
 * The roster. Visible to members of the club.
 *
 * There are no contact details left to gate: accounts have no email address,
 * so the roster is names and usernames, and officers get the management
 * actions rather than a different view of the people.
 */
export async function GET(req, { params }) {
  try {
    const { clubId } = await params;
    if (!isObjectId(clubId)) {
      return NextResponse.json({ error: "Unknown club." }, { status: 400 });
    }

    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, kind: true, description: true },
    });
    if (!club) {
      return NextResponse.json({ error: "Unknown club." }, { status: 404 });
    }

    const viewer = await prisma.member.findFirst({
      where: { clubId, userId: auth.userId },
      select: { role: true },
    });

    const siteRole = auth.claims?.role;
    const isSiteModerator = siteRole === "SUPERUSER" || siteRole === "MODERATOR";

    if (!viewer && !isSiteModerator) {
      return NextResponse.json(
        { error: "Join this club to see its members.", club },
        { status: 403 }
      );
    }

    const canManage = isSiteModerator || viewer?.role === "OFFICER";

    const members = await prisma.member.findMany({
      where: { clubId },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Blocked people stay on the roster - membership is the club's business,
    // and officers need to see everyone - but the viewer gets no way to
    // message them from here.
    const hidden = await hiddenUserIds(auth.userId);

    return NextResponse.json({
      club,
      viewerId: auth.userId,
      viewerRole: isSiteModerator ? "OFFICER" : viewer?.role || null,
      canManage,
      members: members.map((m) => ({ ...m, blocked: hidden.has(m.userId) })),
    });
  } catch (err) {
    console.error("MEMBER LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
