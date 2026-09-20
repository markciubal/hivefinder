"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";
import RequireAuth, { DemoBanner } from "../components/auth/RequireAuth";
import { useAuth } from "../components/auth/AuthProvider";
import KindBadge from "../components/clubs/KindBadge";
import {
  CAMPUS_GROUPS_LOGIN,
  HIVE,
  KIND_COPY,
  OFFICIAL,
  kindOf,
} from "../lib/clubKind";
import { DEMO_MEMBERSHIPS } from "../lib/demoData";

function MembershipCard({ entry, demo }) {
  const kind = kindOf(entry.club);
  const copy = KIND_COPY[kind];
  const isOfficer = entry.role === "OFFICER";

  return (
    <article className="hf-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-black">{entry.club.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <KindBadge club={entry.club} size="xs" />
            {isOfficer && kind === HIVE && (
              <span className="rounded-full border border-[var(--hf-green)] bg-[var(--hf-green)]/10 px-2 py-0.5 text-xxs font-bold text-[var(--hf-green)]">
                Officer
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {entry.club.description || "No description yet."}
          </p>
          {Array.isArray(entry.club.categories) &&
            entry.club.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {entry.club.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-neutral-900 px-2 py-0.5 text-xxs text-white"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
        </div>
        {kind === OFFICIAL ? (
          <a
            href={CAMPUS_GROUPS_LOGIN}
            target="_blank"
            rel="noopener noreferrer"
            className="hf-btn hf-btn-secondary flex-none"
          >
            CampusGroups <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <Link
            href={demo ? copy.browsePath : `/clubs/${entry.club.id}/members`}
            className="hf-btn hf-btn-secondary flex-none"
          >
            {isOfficer ? "Manage" : "Open"}
          </Link>
        )}
      </div>
    </article>
  );
}

/**
 * Memberships split by tier.
 *
 * A flat list would put "CSC 131 Study Crew" next to "Association of Latino
 * Professionals For America" as if they were the same kind of commitment.
 * Grouping keeps the distinction visible even once someone has joined things.
 */
function MembershipSections({ memberships, loading, error, demo }) {
  const { official, hives } = useMemo(() => {
    const official = [];
    const hives = [];
    memberships.forEach((m) =>
      (kindOf(m.club) === OFFICIAL ? official : hives).push(m)
    );
    return { official, hives };
  }, [memberships]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return <p className="hf-card p-6 text-sm text-red-600">{error}</p>;
  }

  if (memberships.length === 0) {
    return (
      <div className="hf-card p-8 text-center">
        <p className="text-sm text-gray-600">
          You have not joined anything yet.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/hives" className="hf-btn hf-btn-primary">
            Browse hives
          </Link>
          <a
            href={CAMPUS_GROUPS_LOGIN}
            target="_blank"
            rel="noopener noreferrer"
            className="hf-btn hf-btn-secondary"
          >
            Official clubs <span aria-hidden="true">&#8599;</span>
          </a>
        </div>
      </div>
    );
  }

  const section = (kind, entries) => {
    const copy = KIND_COPY[kind];
    return (
      <section key={kind} className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-black">{copy.Many}</h2>
          <KindBadge kind={kind} size="xs" />
          <span className="text-sm text-gray-500">({entries.length})</span>
        </div>

        {kind === OFFICIAL && (
          <p className="mb-3 rounded-lg border border-gray-200 bg-[var(--hf-surface-alt)] px-3 py-2 text-xs text-gray-600">
            Official club membership is held by the university.{" "}
            <a
              href={CAMPUS_GROUPS_LOGIN}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--hf-green)] underline"
            >
              Manage it on CampusGroups
            </a>
            .
          </p>
        )}

        {entries.length === 0 ? (
          <p className="hf-card p-5 text-sm text-gray-600">
            None yet.{" "}
            {copy.external ? (
              <a
                href={copy.browsePath}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--hf-green)] underline"
              >
                Browse {copy.many.toLowerCase()} on CampusGroups
              </a>
            ) : (
              <Link
                href={copy.browsePath}
                className="font-semibold text-[var(--hf-green)] underline"
              >
                Browse {copy.many.toLowerCase()}
              </Link>
            )}
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <MembershipCard key={entry.id} entry={entry} demo={demo} />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <>
      {section(OFFICIAL, official)}
      {section(HIVE, hives)}
    </>
  );
}

/** Signed-out preview. */
function MyClubsDemo() {
  return (
    <PageShell
      title="My Memberships"
      description="Official clubs and student hives you belong to."
      width="md"
    >
      <DemoBanner what="your membership list" />
      <div className="hf-demo-surface" data-locked="true">
        <MembershipSections memberships={DEMO_MEMBERSHIPS} demo />
      </div>
    </PageShell>
  );
}

/** Signed-in, real data. */
function MyClubsReal() {
  const { token } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/user/myClubs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok)
          throw new Error(`Failed to load your memberships (${res.status})`);
        const data = await res.json();
        if (!cancelled) setMemberships(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load your memberships");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <PageShell
      title="My Memberships"
      description="Official clubs and student hives you belong to."
      width="md"
      actions={
        <Link href="/createHive" className="hf-btn hf-btn-primary">
          Create a hive
        </Link>
      }
    >
      <MembershipSections
        memberships={memberships}
        loading={loading}
        error={error}
      />
    </PageShell>
  );
}

export default function MyClubsPage() {
  return (
    <RequireAuth what="your membership list" fallback={<MyClubsDemo />}>
      <MyClubsReal />
    </RequireAuth>
  );
}
