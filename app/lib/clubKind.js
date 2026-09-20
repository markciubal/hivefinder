/**
 * The two tiers of listing, and every word the UI uses for them.
 *
 * HiveFinder carries two very different things:
 *
 *  - OFFICIAL — one of the ~336 organizations Sacramento State officially
 *    recognizes, seeded from utilities/clubs.json with its real
 *    csus.campusgroups.com page. Students did not create these and cannot
 *    edit them here.
 *
 *  - HIVE — a group a student made up inside this app. Perfectly legitimate,
 *    but it carries no university recognition.
 *
 * Official clubs are not *run* here at all: joining, rosters and events for
 * them live on Sacramento State's CampusGroups site, and HiveFinder is only a
 * searchable directory that points at it. Hives are the part this app owns.
 *
 * They used to share the word "club" and a single directory, which meant a
 * student could create "Chess Club" and have it sit next to the real one,
 * indistinguishable. Splitting the vocabulary is the fix: an official listing
 * is a *Club*, a student-made one is a *Hive*. Keep the wording here so the
 * two never blur back together.
 */

export const OFFICIAL = "OFFICIAL";
export const HIVE = "HIVE";

export const KIND_COPY = {
  [OFFICIAL]: {
    kind: OFFICIAL,
    one: "club",
    One: "Club",
    many: "clubs",
    Many: "Clubs",
    badge: "Official club",
    // Shown under the badge / in tooltips.
    blurb: "Recognized by Sacramento State",
    // Off-site: anything linking here must open CampusGroups, not a local page.
    browsePath: "https://csus.campusgroups.com/home_login",
    external: true,
    accent: "text-[var(--hf-green)]",
    badgeClass:
      "border-[var(--hf-green)] bg-[var(--hf-green)]/10 text-[var(--hf-green)]",
  },
  [HIVE]: {
    kind: HIVE,
    one: "hive",
    One: "Hive",
    many: "hives",
    Many: "Hives",
    badge: "Student hive",
    blurb: "Made by a student — not an official campus organization",
    browsePath: "/hives",
    external: false,
    accent: "text-amber-700",
    badgeClass: "border-amber-400 bg-amber-50 text-amber-800",
  },
};

/**
 * Read a listing's tier.
 *
 * Documents created before the `kind` field existed have no value. Treating
 * those as HIVE would demote all 336 real clubs, so they fall back to
 * OFFICIAL only when they carry a campus directory URL — the same signal the
 * backfill script uses.
 */
export function kindOf(club) {
  if (club?.kind === OFFICIAL || club?.kind === HIVE) return club.kind;
  return isCampusDirectoryUrl(club?.clubUrl) ? OFFICIAL : HIVE;
}

export function copyFor(club) {
  return KIND_COPY[kindOf(club)];
}

/** Hosts that imply a listing is the university's own page. */
const CAMPUS_HOSTS = [
  "csus.campusgroups.com",
  "campusgroups.com",
  "csus.edu",
];

export function isCampusDirectoryUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return CAMPUS_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** Normalise a name for collision checks: case and spacing insensitive. */
export function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Where official club activity actually happens.
 *
 * Joining, rosters, events and the club directory itself are all handled by
 * CampusGroups. HiveFinder does not mirror any of it - official club links go
 * to the site, and it takes over from there.
 */
export const CAMPUS_GROUPS_LOGIN = "https://csus.campusgroups.com/home_login";

