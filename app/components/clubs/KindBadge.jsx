import React from "react";
import { HIVE, OFFICIAL, copyFor, kindOf } from "../../lib/clubKind";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="size-3.5 flex-none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1.5l2.6 1.9 3.2-.2.9 3.1 2.6 1.9-1.2 3 1.2 3-2.6 1.9-.9 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-.9-3.1L2.7 15.8l1.2-3-1.2-3 2.6-1.9.9-3.1 3.2.2L12 1.5Zm4.03 7.72a.75.75 0 0 0-1.06-1.06l-4.22 4.22-1.72-1.72a.75.75 0 1 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.75-4.75Z"
      />
    </svg>
  );
}

function HexIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="size-3.5 flex-none"
    >
      <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Zm0 2.3L6 8.2v7.6l6 3.4 6-3.4V8.2l-6-3.4Z" />
    </svg>
  );
}

/**
 * Says which tier a listing belongs to.
 *
 * Shown on every listing everywhere — directory, my-clubs, admin — because the
 * whole point of the split is that the distinction is never implicit.
 */
export default function KindBadge({ club, kind, size = "sm", withBlurb = false }) {
  const resolved = kind || kindOf(club);
  const copy = copyFor({ kind: resolved, clubUrl: club?.clubUrl });

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${
          copy.badgeClass
        } ${size === "xs" ? "text-xxs" : "text-xs"}`}
        title={copy.blurb}
      >
        {resolved === OFFICIAL ? <CheckIcon /> : <HexIcon />}
        {copy.badge}
      </span>
      {withBlurb && (
        <span className="text-xxs text-gray-500">{copy.blurb}</span>
      )}
    </span>
  );
}

export { HIVE, OFFICIAL };
