"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";
import RequireAuth, { DemoBanner } from "../components/auth/RequireAuth";
import { useAuth } from "../components/auth/AuthProvider";
import { apiFetch, timeAgo } from "../lib/apiClient";
import { DEMO_THREADS } from "../lib/demoData";

function ThreadList({ threads, demo }) {
  if (threads.length === 0) {
    return (
      <div className="hf-card p-8 text-center">
        <h2 className="font-semibold text-black">No messages yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          Find someone with shared interests in Friend Finder and say hello.
        </p>
        <Link href="/friendFinder" className="hf-btn hf-btn-primary mt-4">
          Open Friend Finder
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
      {threads.map((t) => {
        const inner = (
          <>
            <span
              aria-hidden="true"
              className="flex size-10 flex-none items-center justify-center rounded-full bg-[var(--hf-sage)] text-sm font-bold text-black"
            >
              {(t.other.username || "?").slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span
                  className={`truncate text-sm ${
                    t.unread ? "font-bold text-black" : "font-semibold text-gray-800"
                  }`}
                >
                  {t.other.username}
                </span>
                <span className="flex-none text-xxs text-gray-400">
                  {timeAgo(t.lastMessageAt)}
                </span>
              </span>
              <span
                className={`mt-0.5 block truncate text-sm ${
                  t.unread ? "text-black" : "text-gray-500"
                }`}
              >
                {t.lastMessage?.body || "No messages yet"}
              </span>
            </span>
            {t.unread && (
              <span
                aria-label="Unread"
                className="size-2.5 flex-none rounded-full bg-[var(--hf-honey)]"
              />
            )}
          </>
        );

        const className =
          "flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50";

        return demo ? (
          <div key={t.id} className={className}>
            {inner}
          </div>
        ) : (
          <Link key={t.id} href={`/messages/${t.id}`} className={className}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

function MessagesDemo() {
  return (
    <PageShell title="Messages" description="Your conversations." width="md">
      <DemoBanner what="your inbox" />
      <div className="hf-demo-surface" data-locked="true">
        <ThreadList threads={DEMO_THREADS} demo />
      </div>
    </PageShell>
  );
}

function MessagesReal() {
  const { token } = useAuth();
  const [threads, setThreads] = useState([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiFetch("/api/messages", { token });
        if (!cancelled) {
          setThreads(data.threads || []);
          setBlockedCount(data.blockedCount || 0);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load your messages.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <PageShell
      title="Messages"
      description="Your conversations."
      width="md"
      actions={
        blockedCount > 0 ? (
          <Link href="/messages/blocked" className="hf-btn hf-btn-secondary">
            Blocked ({blockedCount})
          </Link>
        ) : null
      }
    >
      {loading && (
        <div className="space-y-2" aria-busy="true">
          <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}
      {error && <p className="hf-card p-6 text-sm text-red-600">{error}</p>}
      {!loading && !error && <ThreadList threads={threads} />}
    </PageShell>
  );
}

export default function MessagesPage() {
  return (
    <RequireAuth what="your messages" fallback={<MessagesDemo />}>
      <MessagesReal />
    </RequireAuth>
  );
}
