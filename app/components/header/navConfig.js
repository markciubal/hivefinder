/**
 * Single description of the primary navigation.
 *
 * Desktop and mobile menus both render from this list, which is what keeps
 * them in sync — previously each was hand-maintained and they had drifted
 * (mobile hid Club Admin, desktop showed an empty menu when signed out).
 *
 * Four top-level entries, with everything personal behind the account menu.
 * It had grown to nine, which is more than a row holds and more than anyone
 * scans: Home duplicated the logo, Contact duplicated the footer, "My
 * Memberships" appeared under two different menus, Rooms and Chat were the
 * same destination, and posting an event — a thing you do to a hive — was
 * filed under Account.
 *
 * The grouping rule: the top level is for places anyone might go; the account
 * menu is for things that are yours.
 *
 * Item flags:
 *   `auth`      needs a session. Still SHOWN to signed-out visitors, with a
 *               padlock: the page renders a demo preview and invites them in.
 *               Hiding them made the app look empty.
 *   `external`  leaves the site; opens in a new tab.
 *   `role`      "SUPERUSER" = superusers only, "MODERATOR" = both.
 *   `divider`   a rule between groups, not a link.
 */

/** Official clubs are Sacramento State's, and live on CampusGroups. */
export const CAMPUS_GROUPS = "https://csus.campusgroups.com/home_login";

export const NAV = [
  {
    label: "Hives",
    id: "hives",
    tour: "nav-hives",
    items: [
      {
        label: "Browse Hives",
        href: "/hives",
        description: "Groups students made themselves",
      },
      {
        label: "Create a Hive",
        href: "/createHive",
        description: "Start your own group",
        auth: true,
      },
      {
        label: "Modify a Hive",
        href: "/modifyClub",
        description: "Update a hive you run",
        auth: true,
      },
      { divider: true },
      {
        // Sacramento State runs the official directory and it is the only one
        // that can enrol anyone, so this leaves rather than mirroring it. It
        // sits here because this is where someone looking for a club lands.
        label: "Official clubs",
        href: CAMPUS_GROUPS,
        external: true,
        description: "Recognized orgs, on CampusGroups",
      },
    ],
  },
  {
    label: "Events",
    id: "events",
    tour: "nav-events",
    items: [
      {
        label: "All Events",
        href: "/events",
        description: "What is happening across campus",
      },
      {
        label: "Post an Event",
        href: "/createEvent",
        description: "For hive officers",
        auth: true,
      },
    ],
  },
  // Rooms are derived from interests rather than created, so there is nothing
  // to browse and no "my rooms" to keep separate — one destination is all of it.
  { label: "Chat", href: "/chat", tour: "nav-chat" },
  { label: "Friend Finder", href: "/friendFinder" },
];

/**
 * The account menu. Kept apart from NAV because it renders on the right, is
 * labelled with the person's own name, and ends with signing out.
 */
export const ACCOUNT_MENU = [
  {
    label: "My Account",
    href: "/account",
    description: "Profile, interests and colours",
    auth: true,
  },
  {
    label: "Messages",
    href: "/messages",
    description: "Your conversations",
    auth: true,
  },
  {
    label: "My Memberships",
    href: "/myClubs",
    description: "Hives you have joined",
    auth: true,
  },
  { divider: true },
  {
    label: "Moderation Queue",
    href: "/moderation",
    description: "Reports awaiting review",
    auth: true,
    role: "MODERATOR",
  },
  {
    label: "Club Administration",
    href: "/clubAdmin",
    description: "Manage every listing",
    auth: true,
    role: "SUPERUSER",
  },
  { divider: true },
  { label: "Contact", href: "/contact", description: "Questions and problems" },
];

/**
 * Filter a menu for the current viewer, then drop dividers that no longer
 * separate anything — a role-gated group vanishing must not leave a stray
 * rule behind, nor a leading or trailing one.
 */
export function visibleItems(items, { isSuperuser, isModerator } = {}) {
  const allowed = items.filter((item) => {
    if (item.divider) return true;
    if (!item.role) return true;
    if (item.role === "SUPERUSER") return Boolean(isSuperuser);
    if (item.role === "MODERATOR") return Boolean(isModerator || isSuperuser);
    return false;
  });

  return allowed.filter((item, i) => {
    if (!item.divider) return true;
    const before = allowed.slice(0, i).some((x) => !x.divider);
    const after = allowed.slice(i + 1).some((x) => !x.divider);
    return before && after;
  });
}
