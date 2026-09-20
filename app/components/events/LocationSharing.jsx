"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";
import { apiFetch } from "../../lib/apiClient";

/**
 * Explains a hidden location and offers the one switch that reveals it.
 *
 * Location sharing is reciprocal: turning it on means you can read where
 * events are, and that a location you post is readable by others who did the
 * same. The switch says so before it is flipped rather than after.
 */
export default function LocationSharing({ compact = false, onChange }) {
  const { token, isAuthenticated } = useAuth();
  const [sharing, setSharing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/api/user/preferences", { token });
      setSharing(Boolean(data.shareLocation));
    } catch {
      setSharing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiFetch("/api/user/preferences", { token })
      .then((data) => active && setSharing(Boolean(data.shareLocation)))
      .catch(() => active && setSharing(false));
    return () => {
      active = false;
    };
  }, [token]);

  async function toggle() {
    const next = !sharing;

    if (
      next &&
      !window.confirm(
        "Turn on location sharing?\n\n" +
          "• You will see where events are happening.\n" +
          "• Locations you post become visible to others who also turned this on.\n\n" +
          "You can turn it off again at any time."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      const data = await apiFetch("/api/user/preferences", {
        token,
        method: "PATCH",
        body: { shareLocation: next },
      });
      setSharing(Boolean(data.shareLocation));
      onChange?.(Boolean(data.shareLocation));
    } catch (e) {
      setError(e.message || "Could not change the setting.");
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <p className="text-xs text-gray-500">
        Location hidden.{" "}
        <Link href="/login" className="font-semibold underline">
          Sign in
        </Link>{" "}
        and turn on location sharing to see it.
      </p>
    );
  }

  if (sharing === null) {
    return <span className="text-xs text-gray-400">{"Checking…"}</span>;
  }

  if (compact) {
    return (
      <span className="inline-flex flex-col items-start gap-0.5">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className="text-xs font-semibold text-[var(--hf-green)] underline hover:opacity-80"
        >
          {busy
            ? "…"
            : sharing
              ? "Turn off location sharing"
              : "Turn on location sharing to see it"}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-[var(--hf-surface-alt)] p-4">
      <p className="text-sm font-semibold text-black">
        {sharing ? "Location sharing is on" : "Location sharing is off"}
      </p>
      <p className="mt-1 text-sm text-gray-600">
        {sharing
          ? "You can see where events are happening, and locations you post are visible to others who also turned this on."
          : "Event locations are hidden from you, and a location you post will be hidden from anyone who has not turned this on."}
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`hf-btn mt-3 ${sharing ? "hf-btn-secondary" : "hf-btn-primary"}`}
      >
        {busy ? "Saving…" : sharing ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}
