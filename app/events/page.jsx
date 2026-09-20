"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";
import EventCard from "../components/events/EventCard";
import { useAuth } from "../components/auth/AuthProvider";
import { apiFetch } from "../lib/apiClient";
import { DEMO_EVENTS } from "../lib/demoData";

const SCOPES = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

/**
 * Campus-wide event list.
 *
 * Public: browsing events is one of the main reasons to visit without an
 * account. "My clubs" is the only view that needs a session.
 */
export default function EventsPage() {
  const { token, isAuthenticated } = useAuth();

  const [scope, setScope] = useState("upcoming");
  const [mine, setMine] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingSample, setUsingSample] = useState(false);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams({ scope });
        if (mine) qs.set("mine", "1");

        const data = await apiFetch(`/api/events?${qs}`, {
          token: mine ? token : undefined,
          signal,
        });

        setEvents(Array.isArray(data) ? data : []);
        setUsingSample(false);
      } catch (e) {
        if (e.name === "AbortError") return;
        // An empty board looks the same as a broken one, so show samples and
        // label them rather than an ambiguous blank page.
        setEvents(DEMO_EVENTS);
        setUsingSample(true);
        setError(e.message || "Could not load events.");
      } finally {
        setLoading(false);
      }
    },
    [scope, mine, token]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const tab = (active) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
      active
        ? "border-[var(--hf-green)] bg-[var(--hf-green)] text-white"
        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
    }`;

  return (
    <PageShell
      title="Events"
      description="What is happening across Sacramento State clubs and hives."
      width="lg"
      actions={
        <Link href="/createEvent" className="hf-btn hf-btn-primary">
          Post an event
        </Link>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScope(s.id)}
            aria-pressed={scope === s.id}
            className={tab(scope === s.id)}
          >
            {s.label}
          </button>
        ))}

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setMine((m) => !m)}
            aria-pressed={mine}
            className={`${tab(mine)} ml-auto`}
          >
            Only my clubs
          </button>
        )}
      </div>

      {usingSample && (
        <div className="mb-6 rounded-xl border border-[var(--hf-sage-dark)] bg-[var(--hf-sage)] p-4 text-sm text-black/80">
          <strong className="font-bold">Sample events.</strong> {error} These
          examples show how the board looks.
        </div>
      )}

      {loading && (
        <div className="space-y-3" aria-busy="true">
          <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="hf-card p-8 text-center">
          <h2 className="font-semibold text-black">
            {scope === "past" ? "Nothing has happened yet" : "No events coming up"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            {mine
              ? "None of the clubs you belong to have posted anything."
              : "Officers can post events for their club or hive."}
          </p>
          <Link href="/createEvent" className="hf-btn hf-btn-primary mt-4">
            Post an event
          </Link>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
