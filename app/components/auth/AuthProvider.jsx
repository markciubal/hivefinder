"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import * as storage from "../../lib/safeStorage";

/**
 * Single source of truth for "who is signed in".
 *
 * Auth is still token-in-localStorage (set by /login). localStorage is an
 * external store, so this reads it through useSyncExternalStore rather than
 * copying it into state inside an effect — that keeps every consumer in sync
 * (including across tabs) without a cascading re-render on mount.
 *
 * Every access goes through lib/safeStorage, which never throws. getSnapshot
 * runs during render, so an unguarded read here crashed the whole app in any
 * context where storage is blocked — a sandboxed editor preview, or an
 * embedded view with third-party cookies off. Storage being unavailable makes
 * someone anonymous; it does not make the site fail to load.
 *
 * `status` is "loading" on the server and during hydration, then
 * "authenticated" | "anonymous". Pages must not decide anything while loading
 * or they will flash the wrong UI.
 */
const AuthContext = createContext(null);

const LOADING_SNAPSHOT = { status: "loading", user: null, token: null };
const ANONYMOUS_SNAPSHOT = { status: "anonymous", user: null, token: null };

/** Cached so getSnapshot returns a referentially stable object. */
let cachedKey = null;
let cachedSnapshot = LOADING_SNAPSHOT;

function getSnapshot() {
  const rawUser = storage.getItem("user");
  const token = storage.getItem("token");
  // \0 separates the two halves: it cannot occur in either value, so no pair
  // of different sessions can produce the same key.
  const key = `${rawUser}\0${token}`;

  if (key !== cachedKey) {
    cachedKey = key;

    let user = null;
    if (rawUser) {
      try {
        user = JSON.parse(rawUser);
      } catch (e) {
        console.error("Stored user is not valid JSON, treating as signed out:", e);
      }
    }

    // Both halves are required — a token with no user (or the reverse) is a
    // half-written session and should not count as signed in.
    cachedSnapshot =
      user && token
        ? { status: "authenticated", user, token }
        : ANONYMOUS_SNAPSHOT;
  }

  return cachedSnapshot;
}

function getServerSnapshot() {
  return LOADING_SNAPSHOT;
}

const listeners = new Set();

function notify() {
  cachedKey = null; // force a re-read on the next getSnapshot
  listeners.forEach((l) => l());
}

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);

  // "storage" fires for other tabs; the custom event covers this one.
  const onStorage = (e) => {
    if (e.key === "user" || e.key === "token" || e.key === null) notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("hivefinder:auth", notify);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("hivefinder:auth", notify);
  };
}

export function AuthProvider({ children }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  /**
   * Returns false when the session could not be persisted, so the caller can
   * say so instead of showing a success that silently will not survive a
   * refresh.
   */
  const signIn = useCallback((token, user) => {
    const ok =
      storage.setItem("token", token) &&
      storage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("hivefinder:auth"));
    return ok;
  }, []);

  const signOut = useCallback(() => {
    storage.removeItem("token");
    storage.removeItem("user");
    window.dispatchEvent(new Event("hivefinder:auth"));
  }, []);

  const value = useMemo(() => {
    const { status, user, token } = snapshot;
    return {
      user,
      token,
      status,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      // Role only. This used to also recognise a hardcoded superuser email
      // address, which stopped meaning anything when accounts lost their
      // email - and was never more than a backstop for the seeded account,
      // which carries role SUPERUSER anyway.
      isSuperuser: user?.role === "SUPERUSER",
      // Superusers outrank moderators, so they satisfy this too.
      isModerator: user?.role === "MODERATOR" || user?.role === "SUPERUSER",
      // False in a sandboxed preview or with storage blocked. Signing in still
      // works for the current page, but will not survive a reload.
      storageAvailable: storage.storageAvailable(),
      signIn,
      signOut,
    };
  }, [snapshot, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
