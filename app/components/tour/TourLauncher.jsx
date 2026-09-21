"use client";

import React from "react";
import { useTour } from "./TourProvider";

/**
 * Starts the tour. Two shapes, both opt-in:
 *
 *  - `link`, in the header, always available so the tour is findable later;
 *  - `card`, offered once on the home page to someone who has not taken it.
 *
 * Nothing here starts on its own. A tour that launches itself over a page
 * someone was already reading is the reason people distrust them.
 */
export default function TourLauncher({ variant = "link" }) {
  const { start, running, completed, dismissed } = useTour();

  if (running) return null;

  if (variant === "card") {
    // Already seen it, either finished or waved away: the header keeps it
    // reachable, so the card does not need to ask again.
    if (completed || dismissed) return null;

    return (
      <section className="hf-panel mx-auto mt-8 max-w-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-black">First time here?</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-black/70">
          A two-minute walk through hives, events, matching and the chat rooms.
          No account needed.
        </p>
        <button
          type="button"
          onClick={() => start()}
          className="hf-btn hf-btn-primary mt-4"
        >
          Show me around
        </button>
      </section>
    );
  }

  return (
    <button
      type="button"
      onClick={() => start()}
      data-tour="tour-launcher"
      className="text-sm/6 font-semibold text-gray-600 hover:text-[var(--hf-green)]"
    >
      {completed ? "Tour again" : "Take the tour"}
    </button>
  );
}
