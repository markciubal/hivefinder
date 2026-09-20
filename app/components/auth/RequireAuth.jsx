"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

/**
 * Banner pinned above a demo preview. Explains that nothing on screen is real
 * and points at the two ways out.
 */
export function DemoBanner({ what = "this page", reason }) {
  return (
    <div className="mb-6 rounded-xl border border-[var(--hf-sage-dark)] bg-[var(--hf-sage)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-black">
            <span aria-hidden="true">👀</span>
            Demo preview
          </p>
          <p className="mt-1 text-sm text-black/70">
            {reason ||
              `You are seeing sample data so you can try out ${what} without an account. Nothing here is saved.`}
          </p>
        </div>
        <div className="flex flex-none gap-2">
          <Link href="/login" className="hf-btn hf-btn-secondary">
            Log in
          </Link>
          <Link href="/signUp" className="hf-btn hf-btn-primary">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Placeholder shown while the client is still reading stored credentials. */
function AuthSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10" aria-busy="true">
      <span className="sr-only">Checking your session…</span>
      <div className="h-8 w-1/3 animate-pulse rounded bg-gray-100" />
      <div className="mt-6 space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * Gate for anything that needs a session.
 *
 * Rather than bouncing signed-out visitors to /login, the default is to render
 * `fallback` — a demo version of the same screen — so they can see what the
 * feature does before committing to an account. Pass `redirect` for the few
 * places where a preview makes no sense.
 *
 * `role="SUPERUSER"` or `role="MODERATOR"` additionally requires an elevated
 * account (superusers satisfy MODERATOR too); signed-in
 * users without it get a plain "not available" notice rather than the demo,
 * since a fake admin console would be misleading.
 */
export default function RequireAuth({
  children,
  fallback,
  role,
  what,
  reason,
}) {
  const { status, isAuthenticated, isSuperuser, isModerator } = useAuth();

  if (status === "loading") return <AuthSkeleton />;

  if (isAuthenticated) {
    const lacksRole =
      (role === "SUPERUSER" && !isSuperuser) ||
      (role === "MODERATOR" && !isModerator);
    if (lacksRole) {
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-black">Not available</h1>
          <p className="mt-2 text-sm text-gray-600">
            This area is limited to HiveFinder{" "}
            {role === "MODERATOR" ? "moderators" : "administrators"}.
          </p>
          <Link href="/" className="hf-btn hf-btn-primary mt-6">
            Back to home
          </Link>
        </div>
      );
    }
    return children;
  }

  // Signed out.
  if (!fallback) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-black">Sign in to continue</h1>
        <p className="mt-2 text-sm text-gray-600">
          {reason || `You need an account to use ${what || "this page"}.`}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="hf-btn hf-btn-secondary">
            Log in
          </Link>
          <Link href="/signUp" className="hf-btn hf-btn-primary">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return fallback;
}
