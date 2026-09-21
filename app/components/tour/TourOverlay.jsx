"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTour } from "./TourProvider";
import { anchorElement } from "../../lib/tourSteps";

/** Gap between the highlight and the element it surrounds. */
const PAD = 8;

/**
 * The tour's visible half: a dimmed page with a hole cut around the element
 * being described, and a card explaining it.
 *
 * The hole is four rectangles rather than a clip-path, because four plain divs
 * behave identically in every browser and degrade to "no hole" instead of "no
 * dimming" if something goes wrong.
 *
 * If a step's anchor is missing - a nav item hidden at this width, a page that
 * changed - the card centres itself and the step still reads. A tour that
 * blocks the screen because it cannot find a button is worse than one that
 * quietly stops pointing.
 */
export default function TourOverlay() {
  const { running, step, index, total, next, back, stop } = useTour();
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);

  const measure = useCallback(() => {
    if (!step?.anchor) {
      setRect(null);
      return;
    }
    const el = anchorElement(step.anchor);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    // An element scrolled out of view, or collapsed to nothing, is treated as
    // absent rather than spotlighting an empty strip.
    if (r.width === 0 && r.height === 0) {
      setRect(null);
      return;
    }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Re-measure as the page settles: the route change that precedes a step has
  // not necessarily painted when the step becomes current.
  useEffect(() => {
    if (!running) return;

    const frame = requestAnimationFrame(measure);
    const timers = [50, 200, 500].map((ms) => setTimeout(measure, ms));

    const el = step?.anchor ? anchorElement(step.anchor) : null;
    el?.scrollIntoView({ block: "center", behavior: "smooth" });

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [running, step, measure]);

  // Escape leaves, arrows move. A tour you cannot dismiss with Escape is a trap.
  useEffect(() => {
    if (!running) return;
    const onKey = (e) => {
      if (e.key === "Escape") stop();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, next, back, stop]);

  useEffect(() => {
    if (running) cardRef.current?.focus();
  }, [running, index]);

  if (!running || !step) return null;

  const dim = "fixed bg-black/50 z-[60]";
  const hole = rect && {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Place the card under the highlight when there is room, otherwise above it.
  let cardStyle = {};
  if (hole) {
    const below = hole.top + hole.height + 12;
    const fitsBelow =
      typeof window !== "undefined" && below + 220 < window.innerHeight;
    cardStyle = fitsBelow
      ? { top: below, left: Math.max(12, Math.min(hole.left, (typeof window !== "undefined" ? window.innerWidth : 1200) - 372)) }
      : {
          top: Math.max(12, hole.top - 232),
          left: Math.max(12, Math.min(hole.left, (typeof window !== "undefined" ? window.innerWidth : 1200) - 372)),
        };
  }

  return (
    <>
      {hole ? (
        <>
          <div className={dim} style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
          <div className={dim} style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className={dim} style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
          <div className={dim} style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[61] rounded-xl ring-4 ring-[var(--hf-honey)]"
            style={hole}
          />
        </>
      ) : (
        <div className={`${dim} inset-0`} />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
        className={`fixed z-[62] w-[22rem] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white p-5 shadow-2xl outline-none ${
          hole ? "" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        }`}
        style={hole ? cardStyle : undefined}
      >
        <p className="text-xxs font-bold uppercase tracking-wide text-gray-400">
          Step {index + 1} of {total}
        </p>
        <h2 id="tour-title" className="mt-1 text-lg font-bold text-black">
          {step.title}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{step.body}</p>

        <div
          className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-full bg-[var(--hf-green)] transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => stop()}
            className="text-xs font-semibold text-gray-500 hover:text-black"
          >
            Skip
          </button>
          <div className="ml-auto flex gap-2">
            {index > 0 && (
              <button type="button" onClick={back} className="hf-btn hf-btn-secondary">
                Back
              </button>
            )}
            <button type="button" onClick={next} className="hf-btn hf-btn-primary">
              {step.final ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
