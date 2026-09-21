"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";
import TourLauncher from "../tour/TourLauncher";
import KindBadge from "../clubs/KindBadge";
import { HIVE, OFFICIAL } from "../../lib/clubKind";

/**
 * The home page is where most people meet the Clubs/Hives distinction for the
 * first time, so the two tiers get a card each and the badge appears next to
 * the words that name them.
 */
const FEATURES = [
  {
    title: "Official clubs",
    kind: OFFICIAL,
    body: "Search every organization Sacramento State recognizes. Joining and events happen on the university's CampusGroups site — we help you find the right club.",
    href: "https://csus.campusgroups.com/home_login",
    external: true,
    cta: "Open CampusGroups",
  },
  {
    title: "Student hives",
    kind: HIVE,
    body: "Groups students run themselves: study crews, climbing trips, game nights. Anyone can start one.",
    href: "/hives",
    cta: "Browse hives",
  },
  {
    title: "Find your people",
    body: "Friend Finder matches you with students who share your interests and memberships.",
    href: "/friendFinder",
    cta: "Friend Finder",
  },
];

export default function Body() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      {/* Hero */}
      <section className="hf-panel p-8 text-center">
        <img
          src="/logo.png"
          alt="HiveFinder"
          className="mx-auto mb-4 h-auto w-full max-w-[300px]"
        />
        <p className="text-2xl font-bold text-black">
          A one-stop shop for clubs and organizations.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-black/70">
          Everything happening at Sacramento State, and the students behind it.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/hives" className="hf-btn hf-btn-primary">
            Browse hives
          </Link>
          {isAuthenticated ? (
            <Link href="/myClubs" className="hf-btn hf-btn-secondary">
              My memberships
            </Link>
          ) : (
            <Link href="/signUp" className="hf-btn hf-btn-secondary">
              Create an account
            </Link>
          )}
        </div>

        {!isAuthenticated && (
          <p className="mt-4 text-sm text-black/60">
            No account? You can still preview every feature with sample data.
          </p>
        )}
        {isAuthenticated && (
          <p className="mt-4 text-sm text-black/60">
            Welcome back, {user.username}.
          </p>
        )}
      </section>

      <TourLauncher variant="card" />

      {/* Feature cards */}
      <section className="mt-8 grid gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.href} className="hf-card flex flex-col p-6">
            <h2 className="text-lg font-bold text-black">{f.title}</h2>
            {f.kind && (
              <div className="mt-2">
                <KindBadge kind={f.kind} size="xs" />
              </div>
            )}
            <p className="mt-2 flex-1 text-sm text-gray-600">{f.body}</p>
            {f.external ? (
              <a
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hf-btn hf-btn-primary mt-4 self-start"
              >
                {f.cta} <span aria-hidden="true">&#8599;</span>
              </a>
            ) : (
              <Link
                href={f.href}
                className="hf-btn hf-btn-primary mt-4 self-start"
              >
                {f.cta}
              </Link>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
