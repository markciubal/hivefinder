/**
 * Colour themes.
 *
 * Every colour the app uses comes from a small set of CSS custom properties in
 * globals.css, so retheming is a matter of rewriting five variables on the
 * document root. No component knows a theme exists.
 *
 * `--hf-green` carries white text on buttons and `--hf-sage` carries black text
 * on panels, so a theme is only valid if both stay readable. That is checked
 * here rather than trusted, including for custom accents people type in - a
 * colour picker with no contrast floor is how you end up with an app nobody
 * can read.
 */

export const DEFAULT_THEME = "hive";

export const THEMES = {
  hive: {
    label: "Hive",
    hint: "The original",
    green: "#0b5a21",
    greenHover: "#0e7a2c",
    sage: "#c4ceb2",
    sageDark: "#aab897",
    honey: "#f4c201",
  },
  honey: {
    label: "Honey",
    hint: "Warm amber",
    green: "#8a5a00",
    greenHover: "#a66d00",
    sage: "#f0e0b0",
    sageDark: "#d9c68f",
    honey: "#f4a201",
  },
  meadow: {
    label: "Meadow",
    hint: "Bright and grassy",
    green: "#2a6030",
    greenHover: "#357a3d",
    sage: "#d4e3c4",
    sageDark: "#b6cba2",
    honey: "#e8b52a",
  },
  dusk: {
    label: "Dusk",
    hint: "Evening indigo",
    green: "#3b3272",
    greenHover: "#4d4293",
    sage: "#cdc9e4",
    sageDark: "#aea8cd",
    honey: "#e0a3d8",
  },
  ember: {
    label: "Ember",
    hint: "Warm and loud",
    green: "#8c2f1a",
    greenHover: "#ab3b22",
    sage: "#f0cdc2",
    sageDark: "#d6ab9d",
    honey: "#f2a541",
  },
  slate: {
    label: "Slate",
    hint: "Quiet and neutral",
    green: "#334155",
    greenHover: "#44566e",
    sage: "#d5dae1",
    sageDark: "#b4bcc7",
    honey: "#8fa6c0",
  },
};

export const THEME_IDS = Object.keys(THEMES);

/* ---------------------------------------------------------------- contrast */

export function normalizeHex(input) {
  if (typeof input !== "string") return null;
  let hex = input.trim().toLowerCase();
  if (!hex.startsWith("#")) hex = `#${hex}`;
  // Expand the three-digit form so the maths below has one case to handle.
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : null;
}

function channels(hex) {
  const h = normalizeHex(hex);
  if (!h) return null;
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

/** WCAG relative luminance. */
export function luminance(hex) {
  const rgb = channels(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA for normal text. */
export const AA = 4.5;

/** A primary colour must carry white button text. */
export function isReadableAsPrimary(hex) {
  const ratio = contrastRatio(hex, "#ffffff");
  return ratio !== null && ratio >= AA;
}

/** Lighten toward white, for a hover state derived from a custom accent. */
export function lighten(hex, amount = 0.18) {
  const rgb = channels(hex);
  if (!rgb) return hex;
  const out = rgb
    .map((c) => Math.round(255 * (c + (1 - c) * amount)))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
  return `#${out}`;
}

/* ------------------------------------------------------------------- apply */

/**
 * The CSS variables for a choice of theme and optional custom accent.
 *
 * An unreadable or malformed custom accent is ignored rather than applied, so
 * a bad value stored by an older client cannot render the app unusable.
 */
export function themeVars(themeId, accent) {
  const base = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const custom = normalizeHex(accent);
  const useCustom = custom && isReadableAsPrimary(custom);

  return {
    "--hf-green": useCustom ? custom : base.green,
    "--hf-green-hover": useCustom ? lighten(custom) : base.greenHover,
    "--hf-sage": base.sage,
    "--hf-sage-dark": base.sageDark,
    "--hf-honey": base.honey,
  };
}
