"use client";

import React from "react";
import ClubDirectory from "../components/clubs/ClubDirectory";

/**
 * Student-made groups - the only listings HiveFinder searches.
 *
 * Deliberately no sample fallback: an empty hive list is a normal, truthful
 * state, and inventing examples here would put fake student groups next to
 * real ones — the exact confusion the Clubs/Hives split exists to prevent.
 */
export default function BrowseHivesPage() {
  return (
    <ClubDirectory
      intro="Groups students created themselves. Anyone can start one — they carry no university affiliation."
    />
  );
}
