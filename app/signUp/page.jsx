"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth/AuthProvider";
import PageShell from "../components/layout/PageShell";

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!username || !email || !password || !confirm) {
      setError("Fill in every field");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // README FR1 asks for auto-login after registration. /api/auth/register
      // now returns the same { token, user } as /api/auth/login, so we can
      // establish the session here instead of making people re-enter the
      // password they just chose.
      if (data.token && data.user) {
        signIn(data.token, data.user);
        setMsg("Account created — signing you in…");
        setTimeout(() => router.push("/"), 600);
      } else {
        setMsg("Account created — taking you to the login page…");
        setTimeout(() => router.push("/login"), 800);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="Create your account"
      description="Join clubs, find friends and post events."
      width="sm"
    >
      <form onSubmit={onSubmit} className="hf-card space-y-4 p-6">
        <div>
          <label className="hf-label" htmlFor="su-username">
            Username
          </label>
          <input
            id="su-username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="hf-input"
            placeholder="yourname"
          />
        </div>

        <div>
          <label className="hf-label" htmlFor="su-email">
            Email
          </label>
          <input
            id="su-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="hf-input"
            placeholder="you@example.edu"
          />
        </div>

        <div>
          <label className="hf-label" htmlFor="su-password">
            Password
          </label>
          <input
            id="su-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hf-input"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="hf-label" htmlFor="su-confirm">
            Confirm password
          </label>
          <input
            id="su-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="hf-input"
            placeholder="Repeat your password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="hf-btn hf-btn-primary w-full"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>

        <p className="pt-2 text-center text-sm text-gray-600">
          <Link href="/login" className="underline hover:text-black">
            Already have an account?
          </Link>
        </p>
      </form>
    </PageShell>
  );
}
