import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";

/**
 * Who may read an event's location.
 *
 * Event locations stay public in the sense that they are not limited to people
 * who marked interest - but a reader only sees them if they have turned on
 * location sharing themselves. The exchange is reciprocal: you do not get to
 * read where other people will be while keeping your own whereabouts private.
 *
 * Signed-out readers never see a location, because they cannot opt in.
 *
 * Enforced here rather than in the UI. Sending the location and hiding it in a
 * component would put it one devtools keystroke away, which is not hiding it.
 */

/** Does this request come from someone who opted in? */
export async function viewerSharesLocation(req) {
  const auth = requireUser(req);
  if (auth.error) return false;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { shareLocation: true },
  });

  return Boolean(user?.shareLocation);
}

/**
 * Strip `location` unless the reader opted in.
 *
 * `locationHidden` tells the client there is a location to reveal, so it can
 * offer the toggle instead of implying the event has no venue.
 */
export function applyLocationVisibility(event, canSee) {
  if (!event) return event;
  if (canSee) return { ...event, locationHidden: false };

  return {
    ...event,
    location: null,
    locationHidden: Boolean(event.location),
  };
}

export function applyLocationVisibilityAll(events, canSee) {
  return events.map((e) => applyLocationVisibility(e, canSee));
}
