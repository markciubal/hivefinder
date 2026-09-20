import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isObjectId, requireUser } from "@/lib/apiAuth";

/**
 * DELETE /api/blocks/[userId] - unblock.
 *
 * Only removes the caller's own block. If the other person has also blocked
 * the caller, that block stands and messaging stays closed.
 */
export async function DELETE(req, { params }) {
  try {
    const { userId } = await params;
    if (!isObjectId(userId)) {
      return NextResponse.json({ error: "Unknown user." }, { status: 400 });
    }

    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const result = await prisma.block.deleteMany({
      where: { blockerId: auth.userId, blockedId: userId },
    });

    return NextResponse.json({ success: true, removed: result.count });
  } catch (err) {
    console.error("UNBLOCK ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
