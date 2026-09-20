"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";
import { apiFetch, timeAgo } from "../../lib/apiClient";

/** How often to re-check while the tab is visible. */
const POLL_MS = 60000;

/** Talks to the server and nothing else - no React state in here. */
function fetchNotifications(token) {
  return apiFetch("/api/notifications?limit=15", { token });
}

const ICONS = {
  MESSAGE: "✉️",
  EVENT_CREATED: "📅",
  EVENT_CANCELLED: "🚫",
  CLUB_JOINED: "🎉",
  OFFICER_GRANTED: "⭐",
  OFFICER_REVOKED: "☆",
  FLAG_RECEIVED: "🚩",
  FLAG_RESOLVED: "✅",
};

/**
 * Header bell.
 *
 * Polls rather than holding a socket: the notification volume here is tiny and
 * a socket would mean infrastructure the rest of the app does not need. The
 * poll pauses while the tab is hidden so a backgrounded tab is not a
 * once-a-minute request forever.
 */
export default function NotificationBell() {
  const { token, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wrapRef = useRef(null);

  const apply = useCallback((data) => {
    setItems(data.notifications || []);
    setUnread(data.unreadCount || 0);
    setError("");
  }, []);

  // A failed poll is not worth shouting about; keep the last good list.
  const fail = useCallback(
    (e) => setError(e.message || "Could not load notifications"),
    []
  );

  /** On-demand refresh for event handlers (opening the menu, a failed write). */
  const load = useCallback(async () => {
    if (!token) return;
    try {
      apply(await fetchNotifications(token));
    } catch (e) {
      fail(e);
    }
  }, [token, apply, fail]);

  // Polling. State is only ever set inside the promise callbacks, and `active`
  // drops any response that lands after unmount - otherwise a slow poll could
  // write one user's notifications into the next user's bell.
  //
  // No reset-on-sign-out: the Header keys this component by user id, so a
  // different account gets a fresh instance.
  useEffect(() => {
    if (!token) return;
    let active = true;

    const refresh = () =>
      fetchNotifications(token)
        .then((data) => active && apply(data))
        .catch((e) => active && fail(e));

    refresh();

    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      active = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [token, apply, fail]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  }

  async function markAllRead() {
    if (!token || unread === 0) return;
    // Optimistic: the badge should clear the instant it is clicked.
    const previous = items;
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setUnread(0);
    try {
      await apiFetch("/api/notifications/read", {
        token,
        method: "POST",
        body: { all: true },
      });
    } catch {
      setItems(previous);
      load();
    }
  }

  async function markOneRead(id) {
    if (!token) return;
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await apiFetch("/api/notifications/read", {
        token,
        method: "POST",
        body: { ids: [id] },
      });
    } catch {
      load();
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={
          unread > 0 ? `Notifications (${unread} unread)` : "Notifications"
        }
        className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-black"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className="size-6"
        >
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-[var(--hf-honey)] px-1 text-xxs font-bold text-neutral-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
            <span className="text-sm font-bold text-black">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-[var(--hf-green)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                Loading…
              </p>
            )}

            {!loading && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                {error || "Nothing yet."}
              </p>
            )}

            {items.map((n) => {
              const isUnread = !n.readAt;
              const inner = (
                <>
                  <span className="flex-none text-base" aria-hidden="true">
                    {ICONS[n.type] || "•"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm ${
                        isUnread ? "font-bold text-black" : "text-gray-700"
                      }`}
                    >
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-0.5 block text-xxs text-gray-400">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  {isUnread && (
                    <span
                      aria-hidden="true"
                      className="mt-1 size-2 flex-none rounded-full bg-[var(--hf-honey)]"
                    />
                  )}
                </>
              );

              const className = `flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                isUnread ? "bg-amber-50/40" : ""
              }`;

              return n.href ? (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    if (isUnread) markOneRead(n.id);
                    setOpen(false);
                  }}
                  className={className}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => isUnread && markOneRead(n.id)}
                  className={className}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
