import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireUser } from "@/lib/apiAuth";

/**
 * GET /api/clubs/status?clubId=...
 *
 * Membership state for the join/leave button. Signed-out callers get
 * { member: false } rather than a 401, since "not a member" is exactly what
 * the button should show them.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get("clubId");

    if (!isObjectId(clubId)) {
      return NextResponse.json({ member: false, role: null });
    }

    const auth = requireUser(req);
    if (auth.error) return NextResponse.json({ member: false, role: null });

    const found = await prisma.member.findFirst({
      where: { userId: auth.userId, clubId },
      select: { role: true },
    });

    return NextResponse.json({ member: Boolean(found), role: found?.role || null });
  } catch (err) {
    console.error("STATUS ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
