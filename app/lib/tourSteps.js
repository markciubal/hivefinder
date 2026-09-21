/**
 * The guided tour, as data.
 *
 * Each step names a route and, optionally, an element to spotlight. Anchors
 * are `data-tour` attributes rather than class names or DOM structure, so
 * restyling a component cannot silently break the tour - the attribute is the
 * contract, and it is greppable.
 *
 * Every step works signed out. The pages behind a login already render a
 * labelled demo preview, so a visitor can take the whole tour before deciding
 * to make an account, which is the point of having one.
 */

export const TOUR_STORAGE_KEY = "hivefinder:tour";

export const STEPS = [
  {
    id: "welcome",
    path: "/",
    title: "Welcome to HiveFinder",
    body: "Two minutes, seven stops. You can leave at any point and pick it up again later.",
  },
  {
    id: "hives",
    path: "/hives",
    anchor: "nav-hives",
    title: "Hives are student-made groups",
    body: "A study crew, a climbing trip, a game night. Anyone can start one. Official Sac State clubs live on CampusGroups — the Clubs menu links straight there.",
  },
  {
    id: "events",
    path: "/events",
    anchor: "nav-events",
    title: "Events are what hives actually do",
    body: "Officers post them and everyone in the hive is notified. Locations stay hidden until you turn on location sharing.",
  },
  {
    id: "friends",
    path: "/friendFinder",
    title: "Friend Finder matches on what you have in common",
    body: "Shared interests and shared memberships. The more interests you add, the better this gets.",
  },
  {
    id: "interests",
    path: "/account",
    anchor: "account-interests",
    title: "Your interests drive everything",
    body: "They decide who you match with, and in a moment, which chat rooms you land in. Worth spending a minute on.",
  },
  {
    id: "colours",
    path: "/account",
    anchor: "account-colours",
    title: "Make it yours",
    body: "Six themes, or pick your own accent. Every option is contrast-checked, so the text stays readable whatever you choose.",
  },
  {
    id: "rooms",
    path: "/chat",
    anchor: "chat-map",
    title: "Your interests are a map",
    body: "Each circle is a subject and each overlap is a room. Where circles cross, so do the people — that overlap is where a conversation already has something to be about.",
  },
  {
    id: "chat",
    path: "/chat",
    anchor: "chat-room",
    title: "Pick an overlap and start talking",
    body: "Narrow rooms are quiet and specific; broad ones are busy. Pick a region on the map and start talking — no joining, no invites. Your interests already put you there.",
    final: true,
  },
];

export const STEP_COUNT = STEPS.length;

/** `data-tour` value -> the element, or null. */
export function anchorElement(anchor) {
  if (!anchor || typeof document === "undefined") return null;
  return document.querySelector(`[data-tour="${anchor}"]`);
}
