"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "../components/layout/PageShell";
import RequireAuth, { DemoBanner } from "../components/auth/RequireAuth";
import { useSignInPrompt } from "../components/auth/SignInPrompt";
import { useAuth } from "../components/auth/AuthProvider";
import KindBadge from "../components/clubs/KindBadge";
import { apiFetch, toLocalInputValue } from "../lib/apiClient";
import { OFFICIAL } from "../lib/clubKind";
import { DEMO_EVENT_DRAFT, DEMO_OFFICER_HIVES } from "../lib/demoData";

/**
 * Posting an event.
 *
 * Only officers of a club may post for it, so the club picker lists exactly
 * the clubs the signed-in person is an officer of. If that list is empty the
 * form is not shown at all - offering a form that will always 403 is worse
 * than explaining why.
 */
function EventForm({ clubs, initial, onSubmit, error, msg, submitting, demo, onDemoAction }) {
  const [values, setValues] = useState({
    clubId: clubs[0]?.id || "",
    title: initial?.title || "",
    description: initial?.description || "",
    location: initial?.location || "",
    startsAt: initial?.startsAt || toLocalInputValue(),
    endsAt: initial?.endsAt || "",
    tags: initial?.tags?.join(", ") || "",
  });

  const set = (key) => (e) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    if (demo) {
      onDemoAction("posting an event");
      return;
    }
    onSubmit({
      ...values,
      tags: values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  const endBeforeStart =
    values.endsAt && values.startsAt && values.endsAt < values.startsAt;

  return (
    <form onSubmit={handleSubmit} className="hf-card space-y-4 p-6">
      <div>
        <label className="hf-label" htmlFor="ev-club">
          Posting as
        </label>
        <select
          id="ev-club"
          className="hf-input"
          value={values.clubId}
          onChange={set("clubId")}
          required={!demo}
        >
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Only hives you are an officer of appear here. Official club events
          are posted on CampusGroups.
        </p>
      </div>

      <div>
        <label className="hf-label" htmlFor="ev-title">
          Event title
        </label>
        <input
          id="ev-title"
          className="hf-input"
          required={!demo}
          value={values.title}
          onChange={set("title")}
          placeholder="Perseid Meteor Watch"
        />
      </div>

      <div>
        <label className="hf-label" htmlFor="ev-description">
          Description
        </label>
        <textarea
          id="ev-description"
          className="hf-input"
          rows={4}
          value={values.description}
          onChange={set("description")}
          placeholder="What is happening, and what should people bring?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="hf-label" htmlFor="ev-starts">
            Starts
          </label>
          <input
            id="ev-starts"
            type="datetime-local"
            className="hf-input"
            required={!demo}
            value={values.startsAt}
            onChange={set("startsAt")}
          />
        </div>
        <div>
          <label className="hf-label" htmlFor="ev-ends">
            Ends (optional)
          </label>
          <input
            id="ev-ends"
            type="datetime-local"
            className="hf-input"
            value={values.endsAt}
            onChange={set("endsAt")}
          />
          {endBeforeStart && (
            <p className="mt-1 text-xs font-semibold text-red-600">
              The end time is before the start time.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="hf-label" htmlFor="ev-location">
          Location
        </label>
        <input
          id="ev-location"
          className="hf-input"
          value={values.location}
          onChange={set("location")}
          placeholder="General area, or how you will share it"
        />
      </div>

      <div>
        <label className="hf-label" htmlFor="ev-tags">
          Tags
        </label>
        <input
          id="ev-tags"
          className="hf-input"
          value={values.tags}
          onChange={set("tags")}
          placeholder="Stargazing, Camping, Road Trip"
        />
        <p className="mt-1 text-xs text-gray-500">Separate with commas.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <button
        type="submit"
        disabled={submitting || endBeforeStart}
        className="hf-btn hf-btn-primary w-full"
      >
        {submitting ? "Posting…" : "Post event"}
      </button>
    </form>
  );
}

function CreateEventDemo() {
  const { promptSignIn, prompt } = useSignInPrompt();

  return (
    <PageShell
      title="Post an event"
      description="Hive officers can post events here."
      width="sm"
    >
      <DemoBanner
        what="the event poster"
        reason="This form is prefilled with a sample event so you can see what is asked for. Posting needs an officer account."
      />
      <EventForm
        clubs={DEMO_OFFICER_HIVES}
        initial={DEMO_EVENT_DRAFT}
        demo
        onDemoAction={promptSignIn}
      />
      {prompt}
    </PageShell>
  );
}

function CreateEventReal() {
  const router = useRouter();
  const { token } = useAuth();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Find the clubs this person is an officer of.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const memberships = await apiFetch("/api/user/myClubs", { token });
        // Official clubs post events on CampusGroups, and the API refuses
        // them, so they never reach the picker.
        const officerClubs = (Array.isArray(memberships) ? memberships : [])
          .filter((m) => m.role === "OFFICER" && m.club?.kind !== OFFICIAL)
          .map((m) => m.club)
          .filter(Boolean);
        if (!cancelled) setClubs(officerClubs);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load your clubs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit(values) {
    setError("");
    setMsg("");
    setSubmitting(true);
    try {
      const data = await apiFetch("/api/events", {
        token,
        method: "POST",
        body: {
          clubId: values.clubId,
          title: values.title,
          description: values.description,
          location: values.location,
          // datetime-local gives a local wall-clock string; new Date() on the
          // server reads it in the server's zone, so send an explicit instant.
          startsAt: new Date(values.startsAt).toISOString(),
          endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
          tags: values.tags,
        },
      });

      setMsg("Event posted! Members have been notified.");
      setTimeout(() => router.push(`/events/${data.event.id}`), 700);
    } catch (e) {
      setError(e.message || "Could not post the event.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Post an event" width="sm">
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" aria-busy="true" />
      </PageShell>
    );
  }

  if (clubs.length === 0) {
    return (
      <PageShell title="Post an event" width="sm">
        <div className="hf-card p-8 text-center">
          <h2 className="font-semibold text-black">
            No hives to post for
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Events here belong to hives, and only their officers can post.
            Start your own hive — you become its officer automatically — or ask
            an existing officer to promote you. Official club events are posted
            on CampusGroups instead.
          </p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/createHive" className="hf-btn hf-btn-primary">
              Create a hive
            </Link>
            <Link href="/myClubs" className="hf-btn hf-btn-secondary">
              My memberships
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Post an event"
      description="Everyone in the hive is notified when you post."
      width="sm"
    >
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-[var(--hf-surface-alt)] p-3 text-sm">
        <span className="font-semibold text-black">Officer of</span>
        {clubs.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1">
            <span className="text-gray-700">{c.name}</span>
            <KindBadge kind={c.kind} size="xs" />
          </span>
        ))}
      </div>

      <EventForm
        clubs={clubs}
        onSubmit={submit}
        error={error}
        msg={msg}
        submitting={submitting}
      />
    </PageShell>
  );
}

export default function CreateEventPage() {
  return (
    <RequireAuth what="posting events" fallback={<CreateEventDemo />}>
      <CreateEventReal />
    </RequireAuth>
  );
}
