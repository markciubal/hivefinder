"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import { apiFetch } from "../../lib/apiClient";
import { DEFAULT_THEME, themeVars } from "../../lib/themes";

/**
 * Cache shape: { theme, accent, vars }.
 *
 * `vars` is the resolved CSS values, stored so the inline bootstrap in
 * layout.tsx can paint them without importing this module. It revalidates
 * every key and value before applying, so a tampered cache cannot inject
 * arbitrary CSS.
 */

/**
 * Applies the signed-in person's colour theme.
 *
 * The chosen theme is mirrored into localStorage so the inline script in
 * layout.tsx can paint it before React runs. Without that, every page load
 * would flash the default green before switching, which is worse than not
 * offering themes at all.
 *
 * The server remains the source of truth: whatever the profile says wins over
 * the cached copy as soon as it arrives.
 */

const STORAGE_KEY = "hivefinder:theme";
const DEFAULT_PREF = { theme: DEFAULT_THEME, accent: null };
const ThemeContext = createContext(null);

function applyVars(theme, accent) {
  if (typeof document === "undefined") return themeVars(theme, accent);
  const vars = themeVars(theme, accent);
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  return vars;
}

function cache(theme, accent, vars) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme, accent, vars })
    );
  } catch {
    // A full or blocked localStorage only costs the no-flash paint.
  }
}

function readCached() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { theme: parsed.theme || DEFAULT_THEME, accent: parsed.accent || null };
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }) {
  const { token, isAuthenticated } = useAuth();

  // Only the server's copy is state. The signed-out value is the default, so
  // it is derived rather than written in an effect - and deriving it also
  // means one person's theme cannot survive into the next person's session
  // on a shared machine.
  const [serverPref, setServerPref] = useState(null);
  const pref = useMemo(
    () => (token && serverPref ? serverPref : DEFAULT_PREF),
    [token, serverPref]
  );

  // Load the server's copy once signed in; fall back to whatever was cached.
  useEffect(() => {
    if (!token) {
      // Touching only external state here - the React value is derived above.
      localStorage.removeItem(STORAGE_KEY);
      applyVars(DEFAULT_THEME, null);
      return;
    }

    let active = true;
    apiFetch("/api/user/preferences", { token })
      .then((data) => {
        if (!active) return;
        const next = { theme: data.theme || DEFAULT_THEME, accent: data.accent || null };
        setServerPref(next);
        cache(next.theme, next.accent, applyVars(next.theme, next.accent));
      })
      .catch(() => {
        if (!active) return;
        const cached = readCached();
        if (cached) {
          setServerPref(cached);
          applyVars(cached.theme, cached.accent);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  /** Preview without saving, so the picker reacts as you hover. */
  const preview = useCallback((theme, accent) => {
    applyVars(theme, accent);
  }, []);

  /** Put back whatever is actually saved. */
  const revert = useCallback(() => {
    applyVars(pref.theme, pref.accent);
  }, [pref]);

  const save = useCallback(
    async (next) => {
      const data = await apiFetch("/api/user/preferences", {
        token,
        method: "PATCH",
        body: next,
      });
      const stored = { theme: data.theme, accent: data.accent || null };
      setServerPref(stored);
      cache(stored.theme, stored.accent, applyVars(stored.theme, stored.accent));
      return stored;
    },
    [token]
  );

  const value = useMemo(
    () => ({ ...pref, isAuthenticated, preview, revert, save }),
    [pref, isAuthenticated, preview, revert, save]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

export { STORAGE_KEY };
