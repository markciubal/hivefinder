"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";
import RequireAuth, { DemoBanner } from "../components/auth/RequireAuth";
import { useSignInPrompt } from "../components/auth/SignInPrompt";
import { useAuth } from "../components/auth/AuthProvider";
import RoomMap from "../components/chat/RoomMap";
import { apiFetch, timeAgo } from "../lib/apiClient";
import { DEMO_CHAT_MESSAGES, DEMO_CHAT_ROWS, DEMO_PROFILE } from "../lib/demoData";

/**
 * Chat rooms, shaped like an Euler diagram (eulerchat).
 *
 * Nobody creates a room and nobody joins one. Subjects overlap, the overlaps
 * are the rooms, and your interests are your subscription - so the rooms you
 * can speak in are worked out from /account and nothing else. A message tagged
 * with a set of subjects reaches everyone holding all of them, which means a
 * post in "hiking" also reaches the hiking+photography crowd, but not the
 * other way round.
 *
 * Polling, not a socket: the same call NotificationBell makes, for the same
 * reason. eulerchat is happy either way - its World holds no connections.
 */

/** How often to re-read the open room while the tab is visible. */
const POLL_MS = 12000;

function subjectsOf(room) {
  return room?.subjects || [];
}

function roomTitle(room) {
  const subjects = subjectsOf(room);
  if (subjects.length === 0) return "";
  return subjects.join(" + ");
}

/**
 * Who can read what you are about to say. Never a guess, and never hidden.
 *
 * `reach` comes from the server's own router. It can be larger than the
 * population drawn on the map, because someone you blocked is still in the
 * room - you stop seeing them, they do not stop reading you. Understating
 * that on the composer would be the one lie this interface must not tell.
 */
function Audience({ room, reach }) {
  const subjects = subjectsOf(room);
  const people = reach ?? room?.population ?? 0;

  return (
    <p className="text-xs text-gray-600">
      {subjects.length === 1 ? (
        <>Everyone who has {subjects[0]} in their interests can read this</>
      ) : (
        <>Only people who have all of {subjects.join(", ")} can read this</>
      )}
      {" — "}
      {people} {people === 1 ? "person" : "people"}.
    </p>
  );
}

function MessageList({ messages, empty }) {
  if (messages.length === 0) {
    return <p className="px-1 py-6 text-center text-sm text-gray-500">{empty}</p>;
  }

  return (
    <ol className="space-y-3">
      {messages.map((m) => (
        <li key={m.id} className="text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={
                m.mine ? "font-bold text-black" : "font-semibold text-gray-800"
              }
            >
              {m.author}
            </span>
            <span className="flex-none text-xxs text-gray-400">
              {timeAgo(m.at)}
            </span>
          </div>
          {m.blocked ? (
            <p className="mt-0.5 italic text-gray-400">
              Hidden — you blocked this person.
            </p>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-gray-700">
              {m.body}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** The room list. Every room, not only the ones with ground to click on. */
function RoomChips({ rooms, selected, onSelect }) {
  if (rooms.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {rooms.map((room) => {
        const active = room.key === selected;
        return (
          <button
            key={room.key}
            type="button"
            onClick={() => onSelect(room)}
            aria-pressed={active}
            className={
              "rounded-full border px-3 py-1 text-xs transition " +
              (active
                ? "border-[var(--hf-green)] bg-[var(--hf-green)] text-white"
                : room.member
                  ? "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
                  : "border-dashed border-gray-300 bg-white text-gray-500 hover:bg-gray-100")
            }
          >
            {roomTitle(room)}
            <span className={active ? "ml-1 text-white/70" : "ml-1 text-gray-400"}>
              {room.population}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The map and the room panel. Shared by the demo and the real page so the
 * preview cannot drift from the thing it is previewing.
 */
function ChatLayout({
  rows,
  focus,
  room,
  rooms,
  onSelectRoom,
  onRender,
  children,
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="hf-card p-4" data-tour="chat-map">
        <h2 className="text-sm font-bold text-black">
          Where your interests overlap
        </h2>

        <div className="mt-3 h-[380px]">
          <RoomMap
            users={rows.users}
            interests={rows.interests}
            focus={focus}
            view="atlas"
            onSelectRoom={onSelectRoom}
            onRender={onRender}
          />
        </div>

        <p className="mt-2 text-xxs text-gray-500">
          Every region is a room, sized by how many people hold exactly that
          combination of interests. Rooms outside your own are faded.
        </p>

        <RoomChips rooms={rooms} selected={room?.key} onSelect={onSelectRoom} />
      </section>

      <section
        className="hf-card flex min-h-[420px] flex-col p-4"
        data-tour="chat-room"
      >
        {children}
      </section>
    </div>
  );
}

function ChatDemo() {
  const { promptSignIn, prompt } = useSignInPrompt();
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);

  const onRender = useCallback((drawn) => setRooms(drawn.rooms || []), []);

  return (
    <PageShell
      title="Chat rooms"
      description="Rooms are the overlaps between interests. Yours put you in them automatically."
      width="lg"
    >
      <DemoBanner what="the chat rooms" />
      <ChatLayout
        rows={DEMO_CHAT_ROWS}
        focus={DEMO_PROFILE.id}
        room={room}
        rooms={rooms}
        onSelectRoom={setRoom}
        onRender={onRender}
      >
        <h2 className="text-sm font-bold text-black">
          {room ? roomTitle(room) : "hiking + photography"}
        </h2>
        <p className="text-xs text-gray-600">
          {room ? `${room.population} here` : "2 here"}
        </p>

        <div className="mt-4 flex-1 overflow-y-auto">
          <MessageList messages={DEMO_CHAT_MESSAGES} empty="Nothing here yet." />
        </div>

        <button
          type="button"
          onClick={() => promptSignIn("talking in the chat rooms")}
          className="hf-btn hf-btn-primary mt-4"
        >
          Sign in to talk
        </button>
      </ChatLayout>
      {prompt}
    </PageShell>
  );
}

function ChatReal() {
  const { token } = useAuth();

  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reach, setReach] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  // The newest message we hold, so a poll asks for the difference rather than
  // the whole room every twelve seconds.
  const since = useRef(0);
  const foot = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiFetch("/api/chat", { token });
        if (!cancelled) setState(data);
      } catch (e) {
        if (!cancelled) setLoadError(e.message || "Could not load the rooms.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const openRoom = useCallback((next) => {
    setRoom(next);
    setMessages([]);
    setReach(null);
    setErr("");
    since.current = 0;
  }, []);

  /** Fetch whatever has arrived since we last looked. */
  const poll = useCallback(async () => {
    if (!room?.key || !token) return;
    try {
      const data = await apiFetch(
        `/api/chat/messages?room=${encodeURIComponent(room.key)}&since=${since.current}`,
        { token }
      );
      if (typeof data.reach === "number") setReach(data.reach);
      const fresh = data.messages || [];
      if (fresh.length === 0) return;
      since.current = Math.max(since.current, ...fresh.map((m) => m.at));
      setMessages((held) => {
        const seen = new Set(held.map((m) => m.id));
        return [...held, ...fresh.filter((m) => !seen.has(m.id))];
      });
    } catch (e) {
      // A room you cannot read is worth saying; a flaky poll is not.
      if (e.status === 403) setErr(e.message);
    }
  }, [room?.key, token]);

  // Poll while the tab is visible, and catch up the moment it comes back.
  useEffect(() => {
    if (!room?.key) return undefined;

    poll();
    const tick = () => {
      if (document.visibilityState === "visible") poll();
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [room?.key, poll]);

  useEffect(() => {
    foot.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const onRender = useCallback((drawn) => setRooms(drawn.rooms || []), []);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !room) return;

    setSending(true);
    setErr("");
    try {
      const data = await apiFetch("/api/chat/messages", {
        token,
        method: "POST",
        body: { subjects: room.subjects, body },
      });
      const posted = data.message;
      if (typeof data.reach === "number") setReach(data.reach);
      since.current = Math.max(since.current, posted.at);
      setMessages((held) =>
        held.some((m) => m.id === posted.id) ? held : [...held, posted]
      );
      setText("");
    } catch (e) {
      setErr(e.message || "Could not send that.");
    } finally {
      setSending(false);
    }
  }

  if (loadError) {
    return (
      <PageShell title="Chat rooms" width="lg">
        <p className="hf-card p-6 text-sm text-red-600">{loadError}</p>
      </PageShell>
    );
  }

  if (!state) {
    return (
      <PageShell title="Chat rooms" width="lg">
        <div className="space-y-3" aria-busy="true">
          <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </PageShell>
    );
  }

  if (state.subscription.length === 0) {
    return (
      <PageShell
        title="Chat rooms"
        description="Rooms are the overlaps between interests."
        width="md"
      >
        <div className="hf-card p-8 text-center">
          <h2 className="font-semibold text-black">You hold no interests yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            There is nothing to join here — the rooms you can speak in are the
            overlaps between the interests on your account. Pick a few and they
            will be waiting.
          </p>
          <Link href="/account" className="hf-btn hf-btn-primary mt-4">
            Choose your interests
          </Link>
        </div>
      </PageShell>
    );
  }

  const mine = room?.member;

  return (
    <PageShell
      title="Chat rooms"
      description="Rooms are the overlaps between interests. Yours put you in them automatically."
      width="lg"
      actions={
        <Link href="/account" className="hf-btn hf-btn-secondary">
          Edit interests
        </Link>
      }
    >
      {state.capped && (
        <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          You hold more interests than the rooms can carry, so only the first 32
          are on the map. Dropping a few on{" "}
          <Link href="/account" className="underline">
            your account
          </Link>{" "}
          decides which.
        </p>
      )}

      <ChatLayout
        rows={state.rows}
        focus={state.me.id}
        room={room}
        rooms={rooms}
        onSelectRoom={openRoom}
        onRender={onRender}
      >
        {!room ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="max-w-xs text-center text-sm text-gray-500">
              Pick a region on the map, or a room below it, to read it.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-bold text-black">{roomTitle(room)}</h2>
            <p className="text-xs text-gray-600">
              {room.population} {room.population === 1 ? "person" : "people"}
              {mine ? " · you are here" : " · you are not in this room"}
            </p>

            <div className="mt-4 flex-1 overflow-y-auto">
              {mine ? (
                <MessageList
                  messages={messages}
                  empty="Nothing said here yet. Be the first."
                />
              ) : (
                <p className="px-1 py-6 text-center text-sm text-gray-500">
                  You can see this room exists and how many people are in it,
                  but not what they say. Add{" "}
                  {room.subjects.join(" and ")} to your interests to take part.
                </p>
              )}
              <div ref={foot} />
            </div>

            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

            {mine ? (
              <form onSubmit={send} className="mt-3 border-t border-gray-200 pt-3">
                <Audience room={room} reach={reach} />
                <div className="mt-2 flex gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="hf-input flex-1"
                    placeholder={`Say something in ${roomTitle(room)}`}
                    maxLength={2000}
                    aria-label={`Message ${roomTitle(room)}`}
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="hf-btn hf-btn-primary flex-none disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
                <p className="mt-2 text-xxs text-gray-500">
                  Words only — images and emoji are stripped. Messages are kept
                  for twelve hours and are lost if the server restarts.
                </p>
              </form>
            ) : (
              <Link href="/account" className="hf-btn hf-btn-secondary mt-3">
                Edit your interests
              </Link>
            )}
          </>
        )}
      </ChatLayout>
    </PageShell>
  );
}

export default function ChatPage() {
  return (
    <RequireAuth what="the chat rooms" fallback={<ChatDemo />}>
      <ChatReal />
    </RequireAuth>
  );
}
