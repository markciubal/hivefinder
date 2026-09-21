import { World } from "eulerchat/store";
import { prisma } from "@/lib/prisma";

/**
 * HiveFinder's people, inside an eulerchat World.
 *
 * eulerchat's model is that subjects overlap and the overlaps are the rooms:
 * a message tagged with a set of subjects reaches everyone whose subscription
 * contains that set. So there is no room table to create and nothing for
 * anyone to join by hand - somebody's interests *are* their subscription, and
 * the rooms they can speak in follow from it. That is what makes "pull in the
 * interests and subscribe them" one operation rather than two.
 *
 * Two things follow from that, and both are deliberate:
 *
 *   - Rooms are derived, so they come and go. Nobody holding both Hiking and
 *     Welding means `hiking+welding` does not exist - not empty, absent. The
 *     first person to hold both brings it into being.
 *   - Editing your interests on /account is the only subscribe control there
 *     is. Every request re-syncs the caller, so a removed interest leaves its
 *     rooms on the next page load.
 *
 * The World is in-memory and per-process, which is eulerchat's own limit (see
 * "Known limits" in its README): a restart empties it, and it cannot be scaled
 * to two processes without becoming two separate chat rooms. Memberships are
 * rebuilt from the database on first use, so only the conversation is lost;
 * that matches the package's twelve-hour retention rather than fighting it.
 */

/** eulerchat's MAX_SUBSCRIPTIONS. Its census is cubic in what one person holds. */
const MAX_HELD = 32;

/** How many students to put on the map. Same ceiling Friend Finder uses. */
const ROSTER_LIMIT = 500;

/**
 * Turn a HiveFinder interest into something `addSubject` will take.
 *
 * It accepts `^[a-z0-9][a-z0-9 -]{0,30}$` and nothing else, which three of the
 * 218 names in utilities/interests.json fail: "Buttons & pins", "Papier-mâché"
 * and "Food/drink blogging" - the last one worst of all, because `/` is how
 * eulerchat writes a private cluster (`kite-fox-9/art`), so it is not rejected
 * as a bad character but as a bad *cluster name*. Dropping three interests
 * would have been a silent hole in the map, so they are folded instead:
 * accents lose their marks, `&` becomes "and", everything else unusable
 * becomes a space.
 *
 * Returns "" for a name with nothing left in it, which the caller skips.
 */
export function subjectName(raw) {
  return String(raw ?? "")
    // Decompose, then drop the combining marks: mâché -> mache.
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31)
    .replace(/^[^a-z0-9]+/, "")
    .trim();
}

/**
 * One World per process, parked on globalThis.
 *
 * Same reason lib/prisma.ts does it: a dev server re-evaluates modules on
 * every edit, and a World that resets whenever someone saves a file would lose
 * the conversation several times an hour.
 */
function store() {
  if (!globalThis.__hiveChatWorld) {
    globalThis.__hiveChatWorld = {
      world: new World(),
      /** HiveFinder user id -> eulerchat user id. `addUser` mints its own. */
      euByHive: new Map(),
      /** And back, to resolve the author of a message for blocking. */
      hiveByEu: new Map(),
      /** The in-flight hydrate, so concurrent requests share one load. */
      hydrating: null,
    };
  }
  return globalThis.__hiveChatWorld;
}

/**
 * Put one person in the world and make their subscription match their
 * interests - joining what is new, leaving what they dropped.
 *
 * Returns their eulerchat id and anything that could not be honoured, so the
 * page can say so rather than quietly holding fewer interests than the person
 * picked.
 */
function admit(s, user) {
  let euId = s.euByHive.get(user.id);
  if (!euId) {
    euId = s.world.addUser(user.username || "anon");
    s.euByHive.set(user.id, euId);
    s.hiveByEu.set(euId, user.id);
  } else {
    s.world.rename(euId, user.username || "anon");
  }

  const wanted = new Set();
  const unusable = [];
  let capped = false;

  for (const raw of user.interests || []) {
    if (wanted.size >= MAX_HELD) {
      capped = true;
      break;
    }
    const name = subjectName(raw);
    if (!name) {
      unusable.push(raw);
      continue;
    }
    try {
      // addSubject returns the canonical name - it strips facets, so "modern
      // jazz" and "jazz" are one subject. Always use what it hands back.
      wanted.add(s.world.addSubject(name));
    } catch {
      unusable.push(raw);
    }
  }

  const held = new Set(s.world.subscription(euId));
  for (const subject of held) {
    if (!wanted.has(subject)) s.world.leave(euId, subject);
  }
  for (const subject of wanted) {
    if (held.has(subject)) continue;
    try {
      s.world.join(euId, subject);
    } catch {
      // The only way this throws is the subscription cap, and it will throw
      // for every remaining subject too.
      capped = true;
      break;
    }
  }

  return { euId, unusable, capped };
}

/**
 * Load the student body once per process.
 *
 * Without this the map would only show people who happen to have opened the
 * chat, so a room's population would mean "people here now" while being drawn
 * as "people who hold this interest". The circle areas are the whole point of
 * the diagram, so they have to count everybody.
 */
function hydrate(s) {
  if (!s.hydrating) {
    s.hydrating = (async () => {
      const users = await prisma.user.findMany({
        select: { id: true, username: true, interests: true },
        take: ROSTER_LIMIT,
      });
      for (const user of users) admit(s, user);
      return users.length;
    })().catch((err) => {
      // A failed hydrate must not poison the singleton: clear it so the next
      // request tries again instead of serving an empty world forever.
      s.hydrating = null;
      throw err;
    });
  }
  return s.hydrating;
}

/**
 * The world as it stands for one caller, with their interests freshly synced.
 *
 * Returns null when the account no longer exists, which the routes turn into
 * a 404 rather than putting a ghost on the map.
 */
export async function chatFor(hiveUserId) {
  const s = store();
  await hydrate(s);

  const user = await prisma.user.findUnique({
    where: { id: hiveUserId },
    select: { id: true, username: true, interests: true },
  });
  if (!user) return null;

  const { euId, unusable, capped } = admit(s, user);

  return {
    world: s.world,
    euId,
    unusable,
    capped,
    /** Who an author is, in HiveFinder's terms. Null for someone since gone. */
    hiveIdFor: (authorId) => s.hiveByEu.get(authorId) ?? null,
    euIdFor: (id) => s.euByHive.get(id) ?? null,
  };
}

/**
 * The rows the map draws from: one per person, one per person-and-interest.
 *
 * These carry eulerchat ids rather than HiveFinder ones. The map only needs
 * something to group by, and an id that means nothing outside this process is
 * a better thing to hand the browser than a database key.
 *
 * Subjects are the canonical names the world holds, not the raw interests, so
 * that a room the map draws is a room the world will accept a message for.
 * `hide` drops people the viewer has blocked, or who blocked them - the same
 * rule Friend Finder applies, since a map row carries a name and a full
 * interest list.
 */
export function rosterRows(world, { hide = new Set(), hiveIdFor } = {}) {
  const users = [];
  const interests = [];

  for (const [euId, profile] of world.profiles) {
    const hiveId = hiveIdFor ? hiveIdFor(euId) : null;
    if (hiveId && hide.has(hiveId)) continue;

    const held = world.subscription(euId);
    if (held.size === 0) continue; // nothing to place them by

    users.push({ id: euId, username: profile.name });
    for (const subject of held) {
      interests.push({ user_id: euId, interest: subject });
    }
  }

  return { users, interests };
}
