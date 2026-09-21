import { prisma } from "@/lib/prisma";

/**
 * Look up the account someone is trying to sign in as.
 *
 * Server-only: this imports Prisma, which is why it is separate from
 * lib/username.js (shared with the browser).
 *
 * The unique index on username is case-sensitive, but people do not type their
 * own name back consistently - especially now that it is the only credential
 * they have, with no email address to fall back on. So: exact match first, and
 * a case-insensitive match only when it resolves to exactly one account.
 * Registration rejects names that collide case-insensitively, so in practice
 * that is always true; the count check is there for rows that predate it,
 * where guessing which "Alice" was meant would be worse than refusing.
 */
export async function findByUsername(username, select) {
  const exact = await prisma.user.findUnique({
    where: { username },
    select,
  });
  if (exact) return exact;

  const matches = await prisma.user.findMany({
    where: { username: { equals: username, mode: "insensitive" } },
    select,
    take: 2,
  });

  return matches.length === 1 ? matches[0] : null;
}
