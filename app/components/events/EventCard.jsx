"use client";

import React from "react";
import Link from "next/link";
import KindBadge from "../clubs/KindBadge";
import { formatDateTime } from "../../lib/apiClient";

/**
 * One event in a list.
 *
 * Cancelled events stay visible rather than disappearing: people were told the
 * event existed, so "cancelled" is more useful to them than absence.
 */
export default function EventCard({ event, showClub = true }) {
  const cancelled = Boolean(event.cancelledAt);
  const interestCount = event._count?.interests ?? event.interestCount ?? 0;

  return (
    <article
      className={`hf-card p-5 ${cancelled ? "opacity-70" : ""}`}
      aria-label={event.title}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-black">
              <Link href={`/events/${event.id}`} className="hover:underline">
                {event.title}
              </Link>
            </h3>
            {cancelled && (
              <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xxs font-bold text-red-700">
                Cancelled
              </span>
            )}
          </div>

          {showClub && event.club && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Link
                href={`/clubs/${event.club.id}/members`}
                className="text-sm font-medium text-[var(--hf-green)] hover:underline"
              >
                {event.club.name}
              </Link>
              <KindBadge kind={event.club.kind} size="xs" />
            </div>
          )}

          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">{formatDateTime(event.startsAt)}</span>
            {event.location && (
              <>
                <span aria-hidden="true"> · </span>
                {event.location}
              </>
            )}
          </p>

          {event.description && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
              {event.description}
            </p>
          )}

          {Array.isArray(event.tags) && event.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {event.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-neutral-900 px-2 py-0.5 text-xxs text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-none flex-col items-start gap-2 sm:items-end">
          <span className="text-xs text-gray-500">
            {interestCount} interested
          </span>
          <Link href={`/events/${event.id}`} className="hf-btn hf-btn-secondary">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
