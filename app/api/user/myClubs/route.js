import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";

/**
 * GET /api/user/myClubs - every club and hive the caller belongs to.
 *
 * Each row carries `role`, which /createEvent uses to work out which clubs the
 * person may post for. Officers first, then newest membership.
 */
export async function GET(req) {
  try {
    const auth = requireUser(req);
    // This route used to swallow auth failures and return [], which rendered
    // as "you have not joined anything" for an expired session. Say what
    // actually happened so the client can react.
    if (auth.error) return auth.error;

    const memberships = await prisma.member.findMany({
      where: { userId: auth.userId },
      include: { club: true },
      orderBy: [{ role: "asc" }, { joinedAt: "desc" }],
    });

    return NextResponse.json(memberships);
  } catch (err) {
    console.error("MY CLUBS ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
