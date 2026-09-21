/**
 * Single description of the primary navigation.
 *
 * Desktop and mobile menus both render from this list, which is what keeps
 * them in sync — previously each was hand-maintained and they had drifted
 * (mobile hid Club Admin, desktop showed an empty menu when signed out).
 *
 * The top level mirrors the two tiers of listing. "Clubs" is the university's
 * recognized organizations; "Hives" is everything students make themselves.
 * Keeping them as separate menus is most of what stops the two blurring —
 * see app/lib/clubKind.js.
 *
 * `auth` marks a destination that needs a session. Those links are still
 * *shown* to signed-out visitors: the page itself renders a demo preview and
 * invites them to sign in. Hiding them made the app look empty.
 *
 * `role` hides a link from anyone without that standing:
 *   "SUPERUSER"  - superusers only
 *   "MODERATOR"  - moderators and superusers
 */
export const NAV = [
  { label: "Home", href: "/" },
  {
    label: "Clubs",
    id: "clubs",
    items: [
      {
        // Off-site. Sacramento State already runs the official directory and
        // it is the only one that can enrol you, so HiveFinder does not
        // mirror it.
        label: "Browse Clubs",
        href: "https://csus.campusgroups.com/home_login",
        external: true,
        description: "Official Sac State orgs, on CampusGroups",
      },
      {
        label: "My Memberships",
        href: "/myClubs",
        description: "Clubs and hives you have joined",
        auth: true,
      },
    ],
  },
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
    ],
  },
  { label: "Events", href: "/events", tour: "nav-events" },
  { label: "Rooms", href: "/rooms" },
  { label: "Friend Finder", href: "/friendFinder" },
  // Rooms are derived from interests rather than created, so there is nothing
  // to browse and no "my rooms" to keep separate - one destination is all of it.
  { label: "Chat", href: "/chat" },
  { label: "Contact", href: "/contact" },
  {
    label: "Account",
    id: "account",
    items: [
      {
        label: "My Account",
        href: "/account",
        description: "Profile and interests",
        auth: true,
      },
      {
        label: "Messages",
        href: "/messages",
        description: "Your conversations",
        auth: true,
      },
      {
        label: "Post an Event",
        href: "/createEvent",
        description: "For hive officers",
        auth: true,
      },
      {
        label: "My Memberships",
        href: "/myClubs",
        description: "Clubs and hives you have joined",
        auth: true,
      },
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
    ],
  },
];

/** Filter a dropdown's items for the current viewer. */
export function visibleItems(items, { isSuperuser, isModerator }) {
  return items.filter((item) => {
    if (!item.role) return true;
    if (item.role === "SUPERUSER") return Boolean(isSuperuser);
    // Superusers outrank moderators, so they see the moderator links too.
    if (item.role === "MODERATOR") return Boolean(isModerator || isSuperuser);
    return false;
  });
}
