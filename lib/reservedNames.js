import clubs from "@/utilities/clubs.json";

/**
 * Names a hive may not take, because a recognized Sacramento State club
 * already uses them.
 *
 * This used to be a database query against Club rows with kind OFFICIAL. Those
 * rows are gone now that clubs live on CampusGroups and are no longer seeded,
 * which would have quietly disarmed the check - a student could create a hive
 * called "Association of Latino Professionals For America" and it would look
 * like the real thing to anyone browsing.
 *
 * So the roster in utilities/clubs.json stays in the repo as a reserved-name
 * list rather than as seed data. It is read once at module load; 336 names is
 * nothing to hold in memory, and it never changes at runtime.
 */

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** normalized name -> the club's name as the university writes it. */
const RESERVED = new Map(
  clubs
    .map((c) => [normalizeName(c.name), c.name])
    .filter(([key]) => key.length > 0)
);

/**
 * The official club whose name this collides with, or null.
 * Case- and spacing-insensitive, matching how people actually retype a name.
 */
export function reservedClubName(name) {
  return RESERVED.get(normalizeName(name)) || null;
}

export { normalizeName };
export const RESERVED_COUNT = RESERVED.size;
