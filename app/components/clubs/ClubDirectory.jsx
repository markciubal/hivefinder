"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "../layout/PageShell";
import KindBadge from "./KindBadge";
import { useAuth } from "../auth/AuthProvider";
import { useSignInPrompt } from "../auth/SignInPrompt";
import { CAMPUS_GROUPS_LOGIN, HIVE, KIND_COPY } from "../../lib/clubKind";

/** Tally how many listings carry each value of an array field. */
function countValues(clubs, field) {
  const map = new Map();
  clubs.forEach((club) => {
    (club[field] || []).forEach((v) => map.set(v, (map.get(v) || 0) + 1));
  });
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Join / leave control.
 *
 * Browsing is open to everyone, so directories are not behind RequireAuth —
 * only the membership action is. Signed-out visitors get a live button and a
 * sign-in prompt rather than a disabled control, so the feature stays
 * discoverable.
 */
function JoinLeaveButton({ clubId, noun, onNeedsAuth }) {
  const { token, isAuthenticated } = useAuth();
  const [isMember, setIsMember] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setIsMember(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/clubs/status?clubId=${clubId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled) setIsMember(Boolean(data.member));
      } catch {
        if (!cancelled) setIsMember(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, token, isAuthenticated]);

  async function toggle() {
    if (!isAuthenticated) {
      onNeedsAuth(`joining a ${noun}`);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const route = isMember ? "leave" : "join";
      const res = await fetch(`/api/clubs/${route}?clubId=${clubId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      // Leave can be refused (e.g. the last officer), so a non-2xx has to be
      // shown - otherwise the button just silently does nothing.
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      if (data.joined) setIsMember(true);
      else if (data.left) setIsMember(false);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const label = !isAuthenticated
    ? `Join ${noun}`
    : isMember === null
      ? "Checking…"
      : isMember
        ? `Leave ${noun}`
        : `Join ${noun}`;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy || (isAuthenticated && isMember === null)}
        className={`hf-btn ${isMember ? "hf-btn-secondary" : "hf-btn-primary"}`}
      >
        {busy ? "Working…" : label}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </span>
  );
}

/**
 * The hive directory.
 *
 * Hives are the only listings HiveFinder searches. Official clubs used to
 * share this screen, but Sacramento State already runs a searchable directory
 * on CampusGroups and that is the one that can enrol you - so they are a link
 * out now, not rows here.
 */
export default function ClubDirectory({ intro }) {
  const copy = KIND_COPY[HIVE];

  const { promptSignIn, prompt } = useSignInPrompt();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  // Hives have no points - the server refuses to set them - so there is no
  // points ordering to offer.
  const [sortBy, setSortBy] = useState("name_asc");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/clubs/list?kind=${HIVE}`);
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (cancelled) return;

        // An empty hive list is a normal, truthful state, so it gets a real
        // empty state rather than invented sample rows.
        setClubs(Array.isArray(data) ? data : []);
      } catch {
        if (cancelled) return;
        setClubs([]);
        setLoadError("Could not reach the hive directory.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryStats = useMemo(() => countValues(clubs, "categories"), [clubs]);
  const fieldStats = useMemo(
    () => countValues(clubs, "fieldsOfStudy"),
    [clubs]
  );

  const toggleIn = (setter) => (value) =>
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const toggleCategory = toggleIn(setSelectedCategories);
  const toggleField = toggleIn(setSelectedFields);

  const filtered = useMemo(() => {
    let result = [...clubs];

    if (searchTerm.trim() !== "") {
      const t = searchTerm.toLowerCase();
      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(t) ||
          (club.description || "").toLowerCase().includes(t)
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((club) =>
        (club.categories || []).some((c) => selectedCategories.includes(c))
      );
    }

    if (selectedFields.length > 0) {
      result = result.filter((club) =>
        (club.fieldsOfStudy || []).some((f) => selectedFields.includes(f))
      );
    }

    result.sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      const pa = typeof a.points === "number" ? a.points : -Infinity;
      const pb = typeof b.points === "number" ? b.points : -Infinity;
      return pb - pa || a.name.localeCompare(b.name);
    });

    return result;
  }, [clubs, searchTerm, selectedCategories, selectedFields, sortBy]);

  const chip = (active) =>
    `rounded-full border px-3 py-1 text-xs transition ${
      active
        ? "border-[var(--hf-green)] bg-[var(--hf-green)] text-white"
        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
    }`;

  return (
    <PageShell
      title={`Browse ${copy.many}`}
      description={intro}
      width="lg"
      actions={
        <Link href="/createHive" className="hf-btn hf-btn-primary">
          Create a hive
        </Link>
      }
    >
      {/* Says what this list is, and where the official clubs went. */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-[var(--hf-surface-alt)] p-3 text-sm">
        <KindBadge kind={HIVE} />
        <span className="text-gray-600">
          Student-made groups. Not affiliated with the university.
        </span>
        <a
          href={CAMPUS_GROUPS_LOGIN}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto font-semibold text-[var(--hf-green)] underline underline-offset-2"
        >
          Looking for official clubs? <span aria-hidden="true">&#8599;</span>
        </a>
      </div>

      {loadError && (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {/* Filters */}
      <div className="hf-card mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="sr-only" htmlFor="dir-search">
              Search {copy.many}
            </label>
            <input
              id="dir-search"
              className="hf-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description…"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="dir-sort">
              Sort {copy.many}
            </label>
            <select
              id="dir-sort"
              className="hf-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
            </select>
          </div>
        </div>

        {categoryStats.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categoryStats.map(({ name, count }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCategory(name)}
                  aria-pressed={selectedCategories.includes(name)}
                  className={chip(selectedCategories.includes(name))}
                >
                  {name} <span className="opacity-60">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {fieldStats.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Field of study
            </p>
            <div className="flex flex-wrap gap-2">
              {fieldStats.map(({ name, count }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleField(name)}
                  aria-pressed={selectedFields.includes(name)}
                  className={chip(selectedFields.includes(name))}
                >
                  {name} <span className="opacity-60">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-3" aria-busy="true">
          <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}

      {!loading && clubs.length === 0 && (
        <div className="hf-card p-8 text-center">
          <h2 className="font-semibold text-black">No hives yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Hives are groups students make themselves — a study group, a
            climbing crew, anything that does not have official club status.
            Be the first.
          </p>
          <Link href="/createHive" className="hf-btn hf-btn-primary mt-4">
            Create a hive
          </Link>
        </div>
      )}

      {!loading && clubs.length > 0 && (
        <>
          <p className="mb-3 text-sm text-gray-600">
            Showing <b>{filtered.length}</b> of {clubs.length}{" "}
            {copy.many.toLowerCase()}
          </p>

          <div className="space-y-3">
            {filtered.map((club) => {
              const open = expanded === club.id;
              return (
                <div key={club.id} className="hf-card overflow-hidden">
                  <h2>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`dir-body-${club.id}`}
                      onClick={() => setExpanded(open ? null : club.id)}
                      className="flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-gray-50"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold text-black">
                          {club.name}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          <KindBadge kind={HIVE} size="xs" />
                        </span>
                      </span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                        className={`size-5 flex-none text-gray-400 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                          fillRule="evenodd"
                        />
                      </svg>
                    </button>
                  </h2>

                  {open && (
                    <div
                      id={`dir-body-${club.id}`}
                      className="border-t border-gray-200 bg-neutral-900/90 p-5 text-left"
                    >
                      <p className="mb-3 text-sm text-gray-100">
                        {club.description || "No description available."}
                      </p>

                      <div className="mb-4 flex flex-wrap gap-1">
                        {(club.categories || []).map((c) => (
                          <span
                            key={c}
                            className="rounded-full bg-white/15 px-2 py-0.5 text-xxs text-white"
                          >
                            {c}
                          </span>
                        ))}
                        {(club.fieldsOfStudy || []).map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-white/10 px-2 py-0.5 text-xxs text-white/80"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      <p className="mb-4 text-xxs text-amber-200/90">
                        This hive was created by a student. It is not an
                        official Sacramento State organization.
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        <JoinLeaveButton
                          clubId={club.id}
                          noun={copy.one}
                          onNeedsAuth={promptSignIn}
                        />

                        <Link
                          href={`/clubs/${club.id}/members`}
                          className="text-xs font-medium text-white underline hover:text-white/80"
                        >
                          Members &amp; events
                        </Link>

                        {club.clubUrl && (
                          <a
                            href={club.clubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-300 underline hover:text-blue-200"
                          >
                            Visit link
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="hf-card p-8 text-center">
                <p className="text-sm text-gray-600">
                  No {copy.many.toLowerCase()} match those filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategories([]);
                    setSelectedFields([]);
                  }}
                  className="hf-btn hf-btn-secondary mt-4"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {prompt}
    </PageShell>
  );
}
