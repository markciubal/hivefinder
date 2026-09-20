"use client";

import { useState } from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";
import { api } from "../lib/api";

export default function NewPasswordPage() {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (pw1.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }
    if (pw1 !== pw2) {
      setErr("Passwords do not match");
      return;
    }

    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setErr("This reset link is missing its token. Request a new one.");
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: { token, password: pw1 },
      });
      setMsg("Password updated — taking you to the login page…");
      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
    } catch (e) {
      setErr(e.message || "Could not update your password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Set a new password"
      description="Choose something at least 8 characters long."
      width="sm"
    >
      <form onSubmit={onSubmit} className="hf-card space-y-4 p-6">
        <div>
          <label className="hf-label" htmlFor="np-pw1">
            New password
          </label>
          <input
            id="np-pw1"
            type="password"
            autoComplete="new-password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            className="hf-input"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="hf-label" htmlFor="np-pw2">
            Confirm password
          </label>
          <input
            id="np-pw2"
            type="password"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="hf-input"
            placeholder="Repeat your password"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}

        <div className="flex gap-3">
          <Link href="/login" className="hf-btn hf-btn-secondary flex-1">
            Back to log in
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="hf-btn hf-btn-primary flex-1"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
