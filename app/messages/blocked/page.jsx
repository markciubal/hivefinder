"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "../../components/layout/PageShell";
import RequireAuth from "../../components/auth/RequireAuth";
import BlockButton from "../../components/moderation/BlockButton";
import { useAuth } from "../../components/auth/AuthProvider";
import { apiFetch, timeAgo } from "../../lib/apiClient";

/**
 * People you have blocked.
 *
 * Blocked threads are hidden from the inbox, so without this page there would
 * be no way back to someone you blocked by mistake. Unblocking keeps the row
 * on screen (as "Unblocked") rather than yanking it away, so a mis-click can be
 * re-blocked immediately.
 */
function BlockedList() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch("/api/blocks", { token })
      .then((data) => {
        if (!active) return;
        setRows((Array.isArray(data) ? data : []).map((r) => ({ ...r, blocked: true })));
      })
      .catch((e) => active && setError(e.message || "Could not load your blocked list."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <PageShell
      title="Blocked people"
      description="They can't message you, and you don't appear in each other's Friend Finder. They are not told."
      width="md"
      actions={
        <Link href="/messages" className="hf-btn hf-btn-secondary">
          Back to messages
        </Link>
      }
    >
      {loading && (
        <div className="space-y-2" aria-busy="true">
          <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}

      {error && <p className="hf-card p-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="hf-card p-8 text-center">
          <p className="text-sm text-gray-600">You haven&apos;t blocked anyone.</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-semibold text-black">@{r.user.username || "unknown"}</p>
                <p className="text-xs text-gray-500">
                  {r.blocked ? `Blocked ${timeAgo(r.createdAt)}` : "Unblocked"}
                </p>
              </div>
              <BlockButton
                userId={r.user.id}
                username={r.user.username}
                blocked={r.blocked}
                onChange={(nowBlocked) =>
                  setRows((prev) =>
                    prev.map((x) => (x.id === r.id ? { ...x, blocked: nowBlocked } : x))
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

export default function BlockedPage() {
  return (
    <RequireAuth what="your blocked list">
      <BlockedList />
    </RequireAuth>
  );
}
