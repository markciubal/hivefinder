"use client";

import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { apiFetch } from "../../lib/apiClient";

/**
 * Block / unblock toggle.
 *
 * Blocking asks for confirmation and says what will happen, because the
 * effects reach further than people expect: the thread leaves their inbox and
 * both people drop out of each other's Friend Finder. Unblocking is one click -
 * making it easy to undo is part of what makes it safe to use freely.
 */
export default function BlockButton({
  userId,
  username,
  blocked,
  onChange,
  className = "",
}) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const name = username || "this person";

    if (
      !blocked &&
      !window.confirm(
        `Block ${name}?\n\n` +
          "• Neither of you will be able to message the other.\n" +
          "• Your conversation will be hidden from your inbox.\n" +
          "• You will not appear in each other's Friend Finder.\n\n" +
          `${name} is not notified. You can unblock at any time.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (blocked) {
        await apiFetch(`/api/blocks/${userId}`, { token, method: "DELETE" });
      } else {
        await apiFetch("/api/blocks", {
          token,
          method: "POST",
          body: { userId },
        });
      }
      onChange?.(!blocked);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={
          blocked
            ? "hf-btn hf-btn-secondary"
            : "text-xs font-semibold text-gray-500 underline hover:text-red-700"
        }
      >
        {busy ? "…" : blocked ? "Unblock" : "Block"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
