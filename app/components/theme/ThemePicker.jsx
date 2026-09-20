"use client";

import React, { useState } from "react";
import { useTheme } from "./ThemeProvider";
import {
  THEMES,
  THEME_IDS,
  contrastRatio,
  isReadableAsPrimary,
  normalizeHex,
} from "../../lib/themes";

/**
 * Pick a colour theme.
 *
 * Hovering a swatch applies it to the whole page immediately and moving away
 * puts it back, so the choice is made against the real app rather than a
 * postage stamp of colour.
 *
 * A custom accent is contrast-checked as it is typed. The check is the same
 * WCAG maths the server runs, so the UI never promises a colour the API will
 * then refuse.
 */
export default function ThemePicker() {
  const { theme, accent, preview, revert, save } = useTheme();

  const [custom, setCustom] = useState(accent || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const customHex = normalizeHex(custom);
  const customRatio = customHex ? contrastRatio(customHex, "#ffffff") : null;
  const customOk = customHex ? isReadableAsPrimary(customHex) : false;

  async function choose(next) {
    setBusy(true);
    setError("");
    setSaved("");
    try {
      await save(next);
      setSaved("Saved");
      setTimeout(() => setSaved(""), 1600);
    } catch (e) {
      setError(e.message || "Could not save the theme.");
      revert();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="hf-card p-6">
      <h2 className="text-lg font-bold text-black">Colours</h2>
      <p className="mt-1 text-sm text-gray-600">
        Pick a theme. Hover to try one before you commit.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEME_IDS.map((id) => {
          const t = THEMES[id];
          const active = theme === id && !accent;
          return (
            <button
              key={id}
              type="button"
              disabled={busy}
              onMouseEnter={() => preview(id, null)}
              onMouseLeave={revert}
              onFocus={() => preview(id, null)}
              onBlur={revert}
              onClick={() => choose({ theme: id, accent: null })}
              aria-pressed={active}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-[var(--hf-green)] ring-2 ring-[var(--hf-green)]/30"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="flex gap-1" aria-hidden="true">
                <span
                  className="h-6 w-6 rounded-full"
                  style={{ background: t.green }}
                />
                <span
                  className="h-6 w-6 rounded-full"
                  style={{ background: t.sage }}
                />
                <span
                  className="h-6 w-6 rounded-full"
                  style={{ background: t.honey }}
                />
              </span>
              <span className="mt-2 block text-sm font-semibold text-black">
                {t.label}
              </span>
              <span className="block text-xs text-gray-500">{t.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <label className="hf-label" htmlFor="accent">
          Or your own accent colour
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="accent"
            type="color"
            value={customHex || "#0b5a21"}
            onChange={(e) => {
              setCustom(e.target.value);
              if (isReadableAsPrimary(e.target.value)) {
                preview(theme, e.target.value);
              }
            }}
            className="h-10 w-14 cursor-pointer rounded border border-gray-300"
            aria-label="Accent colour"
          />
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="#0b5a21"
            className="hf-input w-32 font-mono"
            aria-label="Accent colour hex"
          />
          <button
            type="button"
            disabled={busy || !customOk}
            onClick={() => choose({ theme, accent: customHex })}
            className="hf-btn hf-btn-primary"
          >
            Use this
          </button>
          {accent && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setCustom("");
                choose({ theme, accent: null });
              }}
              className="hf-btn hf-btn-secondary"
            >
              Clear
            </button>
          )}
        </div>

        {custom && !customHex && (
          <p className="mt-2 text-xs text-red-600">
            That is not a valid colour. Try something like #0b5a21.
          </p>
        )}

        {customHex && !customOk && (
          <p className="mt-2 text-xs text-red-600">
            Too light for white button text ({customRatio.toFixed(1)}:1, needs
            4.5:1). Pick a darker shade.
          </p>
        )}

        {customHex && customOk && (
          <p className="mt-2 text-xs text-gray-500">
            Contrast {customRatio.toFixed(1)}:1 against white — readable.
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-green-700">{saved}</p>}
    </section>
  );
}
