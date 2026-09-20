/**
 * localStorage that cannot take the page down with it.
 *
 * Reading or writing localStorage THROWS, rather than returning null, in
 * several ordinary situations:
 *
 *  - a sandboxed iframe without allow-same-origin, which is how VS Code's
 *    Simple Browser and many in-editor previews embed a page: the document
 *    gets an opaque origin and every access raises SecurityError;
 *  - Chrome and Firefox with third-party cookies blocked, for any embedded
 *    context;
 *  - Safari private browsing, historically, on write;
 *  - a full quota, on write.
 *
 * The auth snapshot is read during render, so an unguarded access there took
 * the entire app down before it painted - it rendered in Chrome and showed
 * nothing in the editor's browser.
 *
 * Losing storage should cost the session, not the site: an anonymous visitor
 * can still browse hives, events and Friend Finder previews.
 */

let available = null;

/** Is storage usable? Probed once with a real round-trip, then remembered. */
export function storageAvailable() {
  if (available !== null) return available;
  if (typeof window === "undefined") return false;

  try {
    const probe = "__hf_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }

  return available;
}

export function getItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    available = false;
    return null;
  }
}

/** Returns whether the write actually landed. */
export function setItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    available = false;
    return false;
  }
}

export function removeItem(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    available = false;
    return false;
  }
}
