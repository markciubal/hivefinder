"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import * as storage from "../../lib/safeStorage";
import { STEPS, STEP_COUNT, TOUR_STORAGE_KEY } from "../../lib/tourSteps";

/**
 * Tour state, kept out of the overlay so a page can start or read the tour
 * without rendering one.
 *
 * Progress is remembered, so closing the tab mid-tour resumes where you were
 * rather than starting again. It is never auto-started: an unrequested
 * takeover of the screen is the thing people hate most about these, so the
 * home page offers it and nothing else does.
 */

const TourContext = createContext(null);

const UNSEEN = { completed: false, dismissed: false };

/**
 * The remembered half of the tour, read as an external store.
 *
 * getSnapshot has to return a stable reference or React re-renders forever,
 * so the parsed value is cached and only re-read when something writes.
 */
let cached = UNSEEN;
let cacheValid = false;
const listeners = new Set();

function readState() {
  if (cacheValid) return cached;
  cacheValid = true;

  try {
    const raw = storage.getItem(TOUR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cached = parsed
      ? {
          completed: Boolean(parsed.completed),
          dismissed: Boolean(parsed.dismissed),
        }
      : UNSEEN;
  } catch {
    cached = UNSEEN;
  }

  return cached;
}

function writeState(next) {
  storage.setItem(TOUR_STORAGE_KEY, JSON.stringify(next));
  cached = next;
  cacheValid = true;
  listeners.forEach((l) => l());
}

function subscribeState(onChange) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** The server has no storage, so it always renders the unseen state. */
function serverState() {
  return UNSEEN;
}

export function TourProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // -1 means "not running". Kept in state rather than storage so a reload
  // does not drop someone back into an overlay they did not ask for.
  const [index, setIndex] = useState(-1);
  const persisted = useSyncExternalStore(
    subscribeState,
    readState,
    serverState
  );

  const step = index >= 0 && index < STEP_COUNT ? STEPS[index] : null;

  // Move the route to wherever the current step lives.
  useEffect(() => {
    if (!step || step.path === pathname) return;
    router.push(step.path);
  }, [step, pathname, router]);

  const start = useCallback((from = 0) => setIndex(from), []);

  const stop = useCallback(
    ({ completed = false } = {}) => {
      setIndex(-1);
      writeState({ completed, dismissed: !completed });
    },
    []
  );

  const next = useCallback(() => {
    if (index + 1 >= STEP_COUNT) {
      setIndex(-1);
      writeState({ completed: true, dismissed: false });
      return;
    }
    setIndex(index + 1);
  }, [index]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const value = useMemo(
    () => ({
      step,
      index,
      total: STEP_COUNT,
      running: index >= 0,
      completed: persisted.completed,
      dismissed: persisted.dismissed,
      start,
      stop,
      next,
      back,
    }),
    [step, index, persisted, start, stop, next, back]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside <TourProvider>");
  return ctx;
}
