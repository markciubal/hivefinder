import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, notify, requireClubOfficer } from "@/lib/apiAuth";

/**
 * PATCH /api/clubs/[clubId]/members/[userId]  { role: "OFFICER" | "MEMBER" }
 *
 * Promote or demote someone. Officers only.
 */
export async function PATCH(req, { params }) {
  try {
    const { clubId, userId } = await params;

    if (!isObjectId(clubId) || !isObjectId(userId)) {
      return NextResponse.json({ error: "Unknown member." }, { status: 400 });
    }

    const auth = await requireClubOfficer(req, clubId);
    if (auth.error) return auth.error;

    const { role } = await req.json();
    if (role !== "OFFICER" && role !== "MEMBER") {
      return NextResponse.json({ error: "Unknown role." }, { status: 400 });
    }

    const membership = await prisma.member.findFirst({
      where: { clubId, userId },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "That person is not a member of this club." },
        { status: 404 }
      );
    }

    // A club with no officers cannot be administered by anyone, and nothing
    // else in the app can create one. Block the last demotion rather than
    // stranding the club.
    if (membership.role === "OFFICER" && role === "MEMBER") {
      const officerCount = await prisma.member.count({
        where: { clubId, role: "OFFICER" },
      });
      if (officerCount <= 1) {
        return NextResponse.json(
          {
            error:
              "This is the club's only officer. Promote someone else before " +
              "stepping down.",
          },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.member.update({
      where: { id: membership.id },
      data: { role },
    });

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { name: true },
    });

    await notify(
      [userId],
      role === "OFFICER"
        ? {
            type: "OFFICER_GRANTED",
            title: `You are now an officer of ${club?.name || "a club"}`,
            body: "You can post events and manage the roster.",
            href: `/clubs/${clubId}/members`,
          }
        : {
            type: "OFFICER_REVOKED",
            title: `You are no longer an officer of ${club?.name || "a club"}`,
            body: "You are still a member.",
            href: `/clubs/${clubId}/members`,
          },
      { exclude: auth.userId }
    );

    return NextResponse.json({ success: true, member: updated });
  } catch (err) {
    console.error("MEMBER ROLE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/clubs/[clubId]/members/[userId] - remove someone from the club.
 */
export async function DELETE(req, { params }) {
  try {
    const { clubId, userId } = await params;

    if (!isObjectId(clubId) || !isObjectId(userId)) {
      return NextResponse.json({ error: "Unknown member." }, { status: 400 });
    }

    const auth = await requireClubOfficer(req, clubId);
    if (auth.error) return auth.error;

    const membership = await prisma.member.findFirst({
      where: { clubId, userId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a member." }, { status: 404 });
    }

    if (membership.role === "OFFICER") {
      const officerCount = await prisma.member.count({
        where: { clubId, role: "OFFICER" },
      });
      if (officerCount <= 1) {
        return NextResponse.json(
          { error: "You cannot remove the club's only officer." },
          { status: 409 }
        );
      }
    }

    await prisma.member.delete({ where: { id: membership.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MEMBER REMOVE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
