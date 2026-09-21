import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { chatFor, rosterRows } from "@/lib/chatWorld";
import { hiddenUserIds } from "@/lib/blocks";

/**
 * GET /api/chat - everything the room map needs, for this caller.
 *
 * There is no "join a room" endpoint to go with this, and that is the design
 * rather than a gap: in eulerchat a subscription is a set of subjects and the
 * rooms are its overlaps, so the caller is subscribed to exactly the interests
 * on their account by the time this responds. /account is the control.
 */
export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const chat = await chatFor(auth.userId);
    if (!chat) {
      return NextResponse.json({ error: "Unknown user." }, { status: 404 });
    }

    const hide = await hiddenUserIds(auth.userId);
    const rows = rosterRows(chat.world, { hide, hiveIdFor: chat.hiveIdFor });

    return NextResponse.json({
      me: {
        id: chat.euId,
        name: chat.world.profiles.get(chat.euId)?.name || "anon",
      },
      // What they hold, in the world's own spelling - which is what a room key
      // is made of, so the page can compare the two without guessing.
      subscription: [...chat.world.subscription(chat.euId)].sort(),
      rows,
      // Said out loud rather than swallowed: someone who picked 40 interests
      // should know why only 32 are on the map.
      capped: chat.capped,
      unusable: chat.unusable,
    });
  } catch (err) {
    console.error("CHAT STATE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
