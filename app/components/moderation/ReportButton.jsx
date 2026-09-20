"use client";

import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useSignInPrompt } from "../auth/SignInPrompt";
import { apiFetch } from "../../lib/apiClient";

/**
 * Reasons offered to reporters.
 *
 * IMPERSONATION is first and worded for the Clubs/Hives split, because a hive
 * pretending to be an official club is the specific abuse this app is most
 * exposed to. The server rejects anything outside this list.
 */
const REASONS = [
  {
    id: "IMPERSONATION",
    label: "Pretending to be an official club",
    hint: "Uses a recognized organization's name, branding or links",
  },
  { id: "SPAM", label: "Spam or advertising" },
  { id: "HARASSMENT", label: "Harassment or bullying" },
  { id: "INAPPROPRIATE", label: "Inappropriate content" },
  { id: "INACCURATE", label: "Wrong or out-of-date information" },
  { id: "OTHER", label: "Something else" },
];

/**
 * Opens a small report dialog and posts to /api/flags.
 *
 * Reporting is deliberately low-friction (one click, one reason, optional
 * detail) and idempotent server-side, so a nervous double-click cannot flood
 * the queue.
 */
export default function ReportButton({
  targetType,
  targetId,
  targetLabel,
  className = "",
  label = "Report",
}) {
  const { token, isAuthenticated } = useAuth();
  const { promptSignIn, prompt } = useSignInPrompt();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0].id);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function start() {
    if (!isAuthenticated) {
      promptSignIn("reporting content");
      return;
    }
    setOpen(true);
    setError("");
    setDone(false);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await apiFetch("/api/flags", {
        token,
        method: "POST",
        body: { targetType, targetId, targetLabel, reason, details },
      });
      setDone(true);
      // Being told "you already reported this" is more honest than a silent
      // success that looks like a fresh report.
      if (data.alreadyReported) {
        setError("You have already reported this. A moderator will review it.");
      }
    } catch (e2) {
      setError(e2.message || "Could not send the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={`text-xs font-semibold text-gray-500 underline hover:text-red-700 ${className}`}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Report content"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center">
                <h2 className="text-lg font-bold text-black">
                  {error ? "Already reported" : "Report sent"}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {error ||
                    "Thanks. A moderator will look at this and you will be told the outcome."}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="hf-btn hf-btn-primary mt-6 w-full"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h2 className="text-lg font-bold text-black">
                  Report {targetType.toLowerCase()}
                </h2>
                {targetLabel && (
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {targetLabel}
                  </p>
                )}

                <fieldset className="mt-4">
                  <legend className="hf-label">Why are you reporting it?</legend>
                  <div className="space-y-2">
                    {REASONS.map((r) => (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.id}
                          checked={reason === r.id}
                          onChange={() => setReason(r.id)}
                          className="mt-1"
                        />
                        <span>
                          <span className="block text-sm font-medium text-black">
                            {r.label}
                          </span>
                          {r.hint && (
                            <span className="block text-xs text-gray-500">
                              {r.hint}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-4">
                  <label className="hf-label" htmlFor="report-details">
                    Anything else? (optional)
                  </label>
                  <textarea
                    id="report-details"
                    className="hf-input"
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Context helps moderators act faster."
                  />
                </div>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="hf-btn hf-btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="hf-btn hf-btn-primary flex-1"
                  >
                    {busy ? "Sending…" : "Send report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {prompt}
    </>
  );
}
