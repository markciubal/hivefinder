import { NextResponse } from "next/server";
import { parse, receives } from "eulerchat/regions";
import { requireUser } from "@/lib/apiAuth";
import { chatFor } from "@/lib/chatWorld";
import { hiddenUserIds } from "@/lib/blocks";

/**
 * One room's conversation.
 *
 * A room is not a record anywhere - it is a set of subjects, and its key is
 * those subjects sorted and joined with "+". So the room is named in the
 * query string rather than looked up, and who may read it is decided by the
 * same containment rule that decides delivery.
 */

/** Shape a stored message for the browser. */
function shape(message, { euId, blocked }) {
  return {
    id: message.id,
    room: message.room,
    subjects: message.subjects,
    author: message.author,
    mine: message.authorId === euId,
    blocked,
    // A blocked person's words are withheld, not their existence: a gap in a
    // conversation reads as a conversation with a hole in it.
    body: blocked ? "" : message.body,
    at: message.at,
  };
}

export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const room = String(url.searchParams.get("room") || "").trim();
    const since = Number(url.searchParams.get("since") || 0) || 0;

    if (!room) {
      return NextResponse.json({ error: "Which room?" }, { status: 400 });
    }

    const chat = await chatFor(auth.userId);
    if (!chat) {
      return NextResponse.json({ error: "Unknown user." }, { status: 404 });
    }

    const subjects = parse(room);
    if (subjects.length === 0) {
      return NextResponse.json({ error: "Unknown room." }, { status: 400 });
    }

    // The same predicate that routes a message decides whether this is
    // readable, so the two can never disagree.
    if (!receives(chat.world.subscription(chat.euId), subjects)) {
      return NextResponse.json(
        {
          error:
            "That room is not one of yours. Add every one of its interests on your account to take part.",
          subjects,
        },
        { status: 403 }
      );
    }

    // historyFor only returns rooms this person receives, so it is the safe
    // way in - indexing it cannot hand back somewhere they do not stand.
    const history = chat.world.historyFor(chat.euId)[room] || [];
    const hide = await hiddenUserIds(auth.userId);

    const messages = history
      .filter((m) => m.at > since)
      .map((m) => {
        const hiveId = chat.hiveIdFor(m.authorId);
        return shape(m, { euId: chat.euId, blocked: Boolean(hiveId && hide.has(hiveId)) });
      });

    return NextResponse.json({
      room,
      subjects,
      messages,
      // The router's own number, not the map's. Blocking hides someone's words
      // from the person who blocked them; it does not take either of them out
      // of the room. So the map (which drops blocked people from its rows, as
      // Friend Finder does) draws a smaller circle than this - and it is this
      // number that goes above the composer, because the one promise the
      // interface must not break is who is about to read you.
      reach: chat.world.audienceFor(subjects).length,
    });
  } catch (err) {
    console.error("CHAT READ ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST /api/chat/messages  { subjects: [...], body } */
export async function POST(req) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const payload = await req.json().catch(() => ({}));
    const subjects = Array.isArray(payload.subjects)
      ? payload.subjects.map((s) => String(s))
      : [];
    const body = String(payload.body ?? "");

    if (subjects.length === 0) {
      return NextResponse.json(
        { error: "A message needs at least one interest." },
        { status: 400 }
      );
    }

    const chat = await chatFor(auth.userId);
    if (!chat) {
      return NextResponse.json({ error: "Unknown user." }, { status: 404 });
    }

    let message;
    try {
      // Everything worth refusing is refused in here - posting where you do
      // not stand, more than three subjects, an empty message - and the
      // messages it throws are written to be read by a person.
      message = chat.world.post(chat.euId, subjects, body);
    } catch (e) {
      return NextResponse.json(
        { error: e.message || "That message could not be posted." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: shape(message, { euId: chat.euId, blocked: false }),
      // What it actually reached, which is the honest answer to "who saw
      // that" and is shown above the composer.
      reach: chat.world.audienceFor(message.subjects).length,
    });
  } catch (err) {
    console.error("CHAT POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
