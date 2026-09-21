"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";
import { useAuth } from "../components/auth/AuthProvider";
import { apiFetch } from "../lib/apiClient";
import { DEMO_FRIENDS, DEMO_PROFILE } from "../lib/demoData";

/**
 * Chat rooms, drawn as an Euler diagram by the `eulerchat` package.
 *
 * Each circle is an interest and each overlap is a room, so the people in a
 * room already share the thing it is named after. That is the whole pitch: a
 * conversation with something to be about before anyone speaks.
 *
 * The map needs no server. `eulerchat` reads the rows we already have -
 * /api/friends returns `{ id, username, interests }` and its column guessing
 * picks `interests` up unaided - and computes the layout client-side. Only
 * joining a room needs the chat server.
 */

// mountMap touches the DOM directly, so it must not run during SSR.
const EulerMap = dynamic(
  () => import("eulerchat/react").then((m) => m.EulerMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[420px] animate-pulse rounded-xl bg-gray-100"
        aria-busy="true"
      />
    ),
  }
);

/** Where the chat server lives, if one is running. */
const CHAT_URL = process.env.NEXT_PUBLIC_EULERCHAT_URL || "";

export default function RoomsPage() {
  const { user, isAuthenticated } = useAuth();

  const [people, setPeople] = useState(null);
  const [error, setError] = useState("");
  const [room, setRoom] = useState(null);
  const [view, setView] = useState("map");

  useEffect(() => {
    let active = true;
    apiFetch("/api/friends")
      .then((rows) => {
        if (!active) return;
        setPeople(Array.isArray(rows) && rows.length ? rows : null);
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message || "Could not load people.");
        setPeople(null);
      });
    return () => {
      active = false;
    };
  }, []);

  // With nobody in the database yet, the map would be empty and say nothing
  // about what it is for. The sample cast makes the shape legible.
  const usingSample = people === null && !error ? false : people === null;
  const rows = people || [DEMO_PROFILE, ...DEMO_FRIENDS];
  const focus = isAuthenticated && people ? user?.id : DEMO_PROFILE.id;

  const subjectCount = useMemo(
    () => new Set(rows.flatMap((r) => r.interests || [])).size,
    [rows]
  );

  const roomHref =
    room && CHAT_URL
      ? `${CHAT_URL.replace(/\/$/, "")}/#${encodeURIComponent(room.key)}`
      : null;

  return (
    <PageShell
      title="Rooms"
      description="Your interests, drawn as overlapping subjects. Every overlap is a room."
      width="lg"
    >
      {usingSample && (
        <div className="mb-6 rounded-xl border border-[var(--hf-sage-dark)] bg-[var(--hf-sage)] p-4 text-sm text-black/80">
          <strong className="font-bold">Sample people.</strong> Nobody has
          signed up yet, so this map is drawn from the demo cast to show how it
          works.
        </div>
      )}

      {error && (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="hf-card overflow-hidden p-2" data-tour="rooms-map">
          <EulerMap
            users={rows}
            focus={focus}
            view={view}
            onSelectRoom={setRoom}
            style={{ width: "100%", height: 420 }}
          />
        </div>

        <aside className="space-y-4" data-tour="rooms-panel">
          <div className="hf-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-black">
                {view === "map" ? "Map" : "Atlas"}
              </h2>
              <button
                type="button"
                onClick={() => setView(view === "map" ? "atlas" : "map")}
                className="hf-btn hf-btn-secondary"
              >
                {view === "map" ? "See the atlas" : "See the map"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {rows.length} {rows.length === 1 ? "person" : "people"} ·{" "}
              {subjectCount} {subjectCount === 1 ? "subject" : "subjects"}
            </p>
          </div>

          <div className="hf-card p-4">
            {room ? (
              <>
                <h3 className="font-bold text-black">
                  {room.subjects.join(" ∩ ")}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {room.population}{" "}
                  {room.population === 1 ? "person" : "people"}
                  {room.member ? " · you are here" : ""}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {room.subjects.length > 1
                    ? "A narrow room. Fewer people, more specific — messages here are worth interrupting for."
                    : "A broad room. Busy, and quieter per message."}
                </p>

                {roomHref ? (
                  <a
                    href={roomHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hf-btn hf-btn-primary mt-4 w-full"
                  >
                    Open this room <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-900">
                      No chat server configured
                    </p>
                    <p className="mt-1 text-xs text-amber-900/80">
                      The map works without one. To open rooms, run{" "}
                      <code className="rounded bg-amber-100 px-1">
                        npx eulerchat
                      </code>{" "}
                      and set{" "}
                      <code className="rounded bg-amber-100 px-1">
                        NEXT_PUBLIC_EULERCHAT_URL
                      </code>
                      .
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="font-bold text-black">Pick a region</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Click anywhere on the map. Where two subjects overlap, the
                  people do too — that overlap is a room.
                </p>
              </>
            )}
          </div>

          {!isAuthenticated && (
            <div className="hf-card p-4">
              <p className="text-sm text-gray-600">
                Sign in and add interests to see your own neighbourhood here.
              </p>
              <Link href="/signUp" className="hf-btn hf-btn-primary mt-3 w-full">
                Create an account
              </Link>
            </div>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
