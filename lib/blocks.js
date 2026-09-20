import { prisma } from "@/lib/prisma";

/**
 * Block lookups.
 *
 * A block is stored one way (blocker -> blocked) but enforced both ways, so
 * every check here looks in both directions. Keeping the queries in one place
 * matters: a route that forgot the reverse direction would let a blocked
 * person keep messaging the person who blocked them.
 */

/**
 * The block state between two people, from `viewerId`'s point of view.
 * `byMe` - the viewer blocked them. `byThem` - they blocked the viewer.
 */
export async function blockStatus(viewerId, otherId) {
  if (!viewerId || !otherId || viewerId === otherId) {
    return { byMe: false, byThem: false, any: false };
  }

  const rows = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: viewerId, blockedId: otherId },
        { blockerId: otherId, blockedId: viewerId },
      ],
    },
    select: { blockerId: true },
  });

  const byMe = rows.some((r) => r.blockerId === viewerId);
  const byThem = rows.some((r) => r.blockerId === otherId);
  return { byMe, byThem, any: byMe || byThem };
}

/**
 * Everyone who should be invisible to `userId`: people they blocked plus
 * people who blocked them. One query, returned as a Set for cheap filtering.
 */
export async function hiddenUserIds(userId) {
  if (!userId) return new Set();

  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });

  return new Set(
    rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId))
  );
}

/**
 * The refusal message for a blocked send.
 *
 * When the viewer is the one blocked, the wording is deliberately neutral. It
 * cannot hide that *something* stopped the message, but it should not read
 * as an accusation or invite them to go looking for another way in.
 */
export function blockedMessage(status, otherName = "this person") {
  if (status.byMe) {
    return `You blocked ${otherName}. Unblock them to send a message.`;
  }
  return "You can't message this person.";
}
