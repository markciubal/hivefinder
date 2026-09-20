"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";
import RequireAuth from "../components/auth/RequireAuth";
import { useAuth } from "../components/auth/AuthProvider";
import { apiFetch, timeAgo } from "../lib/apiClient";

const TABS = [
  { id: "OPEN", label: "Open" },
  { id: "REVIEWING", label: "Reviewing" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "DISMISSED", label: "Dismissed" },
];

const REASON_LABEL = {
  IMPERSONATION: "Impersonating an official club",
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  INAPPROPRIATE: "Inappropriate",
  INACCURATE: "Inaccurate",
  OTHER: "Other",
};

/** Where to go to look at the reported thing itself. */
function targetHref(flag) {
  switch (flag.targetType) {
    case "EVENT":
      return `/events/${flag.targetId}`;
    case "CLUB":
      return `/clubs/${flag.targetId}/members`;
    default:
      // Messages and users have no public page, and moderators are not
      // participants in private threads, so there is nothing to link to.
      return null;
  }
}

function FlagRow({ flag, onUpdate, busy }) {
  const [note, setNote] = useState(flag.resolutionNote || "");
  const href = targetHref(flag);
  const closed = flag.status === "RESOLVED" || flag.status === "DISMISSED";
  const impersonation = flag.reason === "IMPERSONATION";

  return (
    <article className={`hf-card p-5 ${impersonation ? "border-amber-300" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xxs font-bold text-white">
          {flag.targetType}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xxs font-bold ${
            impersonation
              ? "border border-amber-400 bg-amber-50 text-amber-800"
              : "border border-gray-300 bg-gray-50 text-gray-700"
          }`}
        >
          {REASON_LABEL[flag.reason] || flag.reason}
        </span>
        <span className="ml-auto text-xs text-gray-400">
          {timeAgo(flag.createdAt)}
        </span>
      </div>

      <h3 className="mt-2 font-semibold text-black">
        {href ? (
          <Link href={href} className="hover:underline">
            {flag.targetLabel || `${flag.targetType} ${flag.targetId}`}
          </Link>
        ) : (
          flag.targetLabel || `${flag.targetType} ${flag.targetId}`
        )}
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        Reported by @{flag.reporter?.username || "unknown"}
        {flag.resolver && ` · handled by @${flag.resolver.username}`}
      </p>

      {flag.details && (
        <blockquote className="mt-3 border-l-2 border-gray-300 pl-3 text-sm text-gray-700">
          {flag.details}
        </blockquote>
      )}

      <div className="mt-4">
        <label className="hf-label" htmlFor={`note-${flag.id}`}>
          Note to reporter {closed ? "" : "(sent when you close this)"}
        </label>
        <textarea
          id={`note-${flag.id}`}
          className="hf-input"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional. The reporter sees this."
          disabled={busy}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {flag.status === "OPEN" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onUpdate(flag, "REVIEWING", note)}
            className="hf-btn hf-btn-secondary"
          >
            Start reviewing
          </button>
        )}
        {!closed && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onUpdate(flag, "RESOLVED", note)}
              className="hf-btn hf-btn-primary"
            >
              Resolve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onUpdate(flag, "DISMISSED", note)}
              className="hf-btn hf-btn-secondary"
            >
              Dismiss
            </button>
          </>
        )}
        {closed && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onUpdate(flag, "OPEN", note)}
            className="hf-btn hf-btn-secondary"
          >
            Reopen
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * The queue.
 *
 * Resolving a report records the decision; it does not itself delete the
 * target. Removing a club still happens from /clubAdmin. Keeping "decide" and
 * "destroy" separate means a mis-click here is always reversible.
 */
function Queue() {
  const { token } = useAuth();
  const [tab, setTab] = useState("OPEN");
  const [flags, setFlags] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/flags?status=${tab}`, { token });
      setFlags(data.flags || []);
      setCounts(data.counts || {});
      setError("");
    } catch (e) {
      setError(e.message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, [tab, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function update(flag, status, resolutionNote) {
    setBusyId(flag.id);
    try {
      await apiFetch(`/api/flags/${flag.id}`, {
        token,
        method: "PATCH",
        body: { status, resolutionNote },
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell
      title="Moderation queue"
      description="Reports from users. The reporter is told when you close one."
      width="md"
      actions={
        <Link href="/clubAdmin" className="hf-btn hf-btn-secondary">
          Club administration
        </Link>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.id
                ? "border-[var(--hf-green)] bg-[var(--hf-green)] text-white"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            {t.label}
            <span className="ml-1 opacity-70">({counts[t.id] || 0})</span>
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="space-y-3" aria-busy="true">
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}

      {!loading && flags.length === 0 && (
        <div className="hf-card p-8 text-center">
          <p className="text-sm text-gray-600">
            {tab === "OPEN" ? "Nothing waiting. 🎉" : "Nothing here."}
          </p>
        </div>
      )}

      {!loading && flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((f) => (
            <FlagRow
              key={f.id}
              flag={f}
              onUpdate={update}
              busy={busyId === f.id}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default function ModerationPage() {
  return (
    <RequireAuth role="MODERATOR" what="the moderation queue">
      <Queue />
    </RequireAuth>
  );
}
