"use client";

import React, { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import RequireAuth, { DemoBanner } from "../components/auth/RequireAuth";
import { useSignInPrompt } from "../components/auth/SignInPrompt";
import { useAuth } from "../components/auth/AuthProvider";
import KindBadge from "../components/clubs/KindBadge";
import { DEMO_ADMIN_CLUBS } from "../lib/demoData";

function Tag({ children, tone = "dark" }) {
  const cls =
    tone === "dark"
      ? "bg-neutral-900 text-white"
      : "bg-neutral-300 text-black";
  return (
    <span
      className={`mr-1 mb-1 inline-block rounded-full px-2 py-0.5 text-[9px] ${cls}`}
    >
      {children}
    </span>
  );
}

/** Shared table. `onDelete`/`onQuarantine` are supplied by each caller. */
function ClubTable({ clubs, loading, error, deletingId, onDelete, onQuarantine }) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <div className="h-10 animate-pulse rounded bg-gray-100" />
        <div className="h-10 animate-pulse rounded bg-gray-100" />
        <div className="h-10 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <>
      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Categories</th>
              <th className="px-3 py-2">Fields of study</th>
              <th className="px-3 py-2 text-center">Points</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clubs.map((club) => (
              <tr key={club.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 align-top">
                  <div className="text-xs font-medium text-gray-900">
                    {club.name}
                  </div>
                  {club.clubUrl && (
                    <a
                      href={club.clubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-block text-[10px] text-blue-600 underline"
                    >
                      Visit club page
                    </a>
                  )}
                </td>

                {/* Admins moderate both tiers from one table, so which tier a
                    row belongs to has to be on the row itself. */}
                <td className="px-3 py-2 align-top">
                  <KindBadge club={club} size="xs" />
                </td>

                <td className="max-w-md px-3 py-2 align-top">
                  <p className="line-clamp-3 text-[11px] text-gray-700">
                    {club.description || "No description"}
                  </p>
                </td>

                <td className="px-3 py-2 align-top text-[10px]">
                  {Array.isArray(club.categories) && club.categories.length
                    ? club.categories.map((c) => <Tag key={c}>{c}</Tag>)
                    : "—"}
                </td>

                <td className="px-3 py-2 align-top text-[10px]">
                  {Array.isArray(club.fieldsOfStudy) && club.fieldsOfStudy.length
                    ? club.fieldsOfStudy.map((f) => (
                        <Tag key={f} tone="light">
                          {f}
                        </Tag>
                      ))
                    : "—"}
                </td>

                <td className="px-3 py-2 text-center align-top text-[11px]">
                  {typeof club.points === "number" ? club.points : "—"}
                </td>

                <td className="px-3 py-2 text-right align-top">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onQuarantine(club)}
                      className="rounded-full bg-yellow-100 px-3 py-1 text-[10px] font-medium text-yellow-800 hover:bg-yellow-200"
                    >
                      Quarantine
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(club)}
                      disabled={deletingId === club.id}
                      className={`rounded-full px-3 py-1 text-[10px] font-medium text-red-800 hover:bg-red-200 ${
                        deletingId === club.id
                          ? "cursor-wait bg-red-100 opacity-60"
                          : "bg-red-100"
                      }`}
                    >
                      {deletingId === club.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {clubs.length === 0 && !error && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-xs text-gray-500"
                >
                  No clubs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

const ADMIN_BADGE = (
  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
    Administrators only
  </span>
);

function ClubAdminDemo() {
  const { promptSignIn, prompt } = useSignInPrompt();

  return (
    <PageShell
      title="Club admin dashboard"
      description="Review and moderate every club on HiveFinder."
      width="xl"
      actions={ADMIN_BADGE}
    >
      <DemoBanner
        what="the moderation tools"
        reason="These are sample clubs. Quarantine and delete are disabled, and the real dashboard is limited to HiveFinder administrators."
      />
      <ClubTable
        clubs={DEMO_ADMIN_CLUBS}
        onDelete={() => promptSignIn("deleting a club")}
        onQuarantine={() => promptSignIn("quarantining a club")}
      />
      {prompt}
    </PageShell>
  );
}

function ClubAdminReal() {
  const { token } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/clubs/list", { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch clubs (${res.status})`);
        const data = await res.json();
        setClubs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load clubs");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  async function handleDelete(club) {
    const sure = window.confirm(
      `Delete club "${club.name}"?\n\nThis permanently removes it.`
    );
    if (!sure) return;

    try {
      setDeletingId(club.id);
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        alert("Your session expired or you are not an administrator.");
        return;
      }
      if (!res.ok) throw new Error(`Failed to delete club (${res.status})`);

      setClubs((prev) => prev.filter((c) => c.id !== club.id));
    } catch (err) {
      alert(`Error deleting club: ${err.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  }

  function handleQuarantine(club) {
    alert(`Quarantine is not implemented yet (requested for "${club.name}").`);
  }

  return (
    <PageShell
      title="Club admin dashboard"
      description="Review and moderate every club on HiveFinder."
      width="xl"
      actions={ADMIN_BADGE}
    >
      <ClubTable
        clubs={clubs}
        loading={loading}
        error={error}
        deletingId={deletingId}
        onDelete={handleDelete}
        onQuarantine={handleQuarantine}
      />
    </PageShell>
  );
}

export default function ClubAdminPage() {
  return (
    <RequireAuth
      role="SUPERUSER"
      what="the admin dashboard"
      fallback={<ClubAdminDemo />}
    >
      <ClubAdminReal />
    </RequireAuth>
  );
}
