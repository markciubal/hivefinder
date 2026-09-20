"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "../components/layout/PageShell";
import { useAuth } from "../components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isAuthenticated, storageAvailable } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // Nothing to do here if you are already signed in.
  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!email || !password) {
      setErr("Enter your email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Login failed");
        return;
      }

      signIn(data.token, data.user);
      setMsg("Logged in");
      setTimeout(() => router.push("/"), 600);
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title="Log in" description="Welcome back to HiveFinder." width="sm">
      {/* Sandboxed previews (VS Code's Simple Browser, some embedded views)
          give the page an opaque origin, so the session cannot be stored.
          Signing in still works for this page but will not survive a reload -
          better to say so than to look broken. */}
      {!storageAvailable && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">This browser is blocking site storage.</p>
          <p className="mt-1">
            You can sign in, but you will be signed out again on reload. Opening
            HiveFinder in a normal browser tab fixes it.
          </p>
        </div>
      )}
      <form onSubmit={onSubmit} className="hf-card space-y-4 p-6">
        <div>
          <label className="hf-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="hf-input"
            placeholder="you@example.edu"
          />
        </div>

        <div>
          <label className="hf-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hf-input"
            placeholder="••••••••"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="hf-btn hf-btn-primary w-full"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <div className="flex items-center justify-between pt-2 text-sm">
          <Link href="/forgotPassword" className="text-gray-600 underline hover:text-black">
            Forgot password?
          </Link>
          <Link href="/signUp" className="text-gray-600 underline hover:text-black">
            Create an account
          </Link>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Just looking around?{" "}
        <Link href="/hives" className="font-semibold underline">
          Browse clubs without an account
        </Link>
      </p>
    </PageShell>
  );
}
