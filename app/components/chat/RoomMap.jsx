"use client";

import dynamic from "next/dynamic";

/**
 * eulerchat's map, loaded in the browser only.
 *
 * `mountMap` draws into an element and measures it, so there is nothing for it
 * to do on the server and it would throw if it tried. Importing it through
 * `dynamic(..., { ssr: false })` is what keeps it off the server render - the
 * component itself is framework-agnostic and React is only an optional peer
 * dependency of the package.
 */
const RoomMap = dynamic(
  () => import("eulerchat/react").then((m) => m.EulerMap),
  {
    ssr: false,
    loading: () => (
      <div
        aria-busy="true"
        className="h-full min-h-[320px] w-full animate-pulse rounded-xl bg-gray-100"
      />
    ),
  }
);

export default RoomMap;
