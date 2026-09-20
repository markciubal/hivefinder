"use client";

import { useState } from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";
import { api } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!email) {
      setErr("Enter your email");
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/forgot-password", { method: "POST", body: { email } });
      // The endpoint returns 200 whether or not the account exists, so the
      // message deliberately does not confirm either way.
      setMsg("If that email has an account, we sent a reset link. Check your inbox.");
    } catch {
      setErr("Could not send the email. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Forgot password"
      description="We will email you a link to set a new one."
      width="sm"
    >
      <form onSubmit={onSubmit} className="hf-card space-y-4 p-6">
        <div>
          <label className="hf-label" htmlFor="fp-email">
            Email
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            className="hf-input"
            placeholder="you@example.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="hf-btn hf-btn-primary w-full"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>

        <p className="pt-2 text-center text-sm text-gray-600">
          <Link href="/login" className="underline hover:text-black">
            Back to log in
          </Link>
        </p>
      </form>
    </PageShell>
  );
}
