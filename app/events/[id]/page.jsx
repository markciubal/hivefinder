"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageShell from "../../components/layout/PageShell";
import KindBadge from "../../components/clubs/KindBadge";
import ReportButton from "../../components/moderation/ReportButton";
import LocationSharing from "../../components/events/LocationSharing";
import { useAuth } from "../../components/auth/AuthProvider";
import { useSignInPrompt } from "../../components/auth/SignInPrompt";
import { apiFetch, formatDateTime } from "../../lib/apiClient";

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const { promptSignIn, prompt } = useSignInPrompt();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/events/${id}`, { token });
      setEvent(data);
    } catch (e) {
      setError(e.message || "Could not load this event.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  // Officer check is a separate call: the event payload deliberately does not
  // leak the roster.
  useEffect(() => {
    if (!event?.club?.id || !token) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await apiFetch(`/api/clubs/${event.club.id}/members`, {
          token,
        });
        if (!cancelled) setCanManage(Boolean(data.canManage));
      } catch {
        if (!cancelled) setCanManage(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [event?.club?.id, token]);

  async function toggleInterest() {
    if (!isAuthenticated) {
      promptSignIn("marking interest in an event");
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch(`/api/events/${id}/interest`, {
        token,
        method: "POST",
      });
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              viewerInterested: data.interested,
              _count: { ...prev._count, interests: data.count },
            }
          : prev
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelEvent() {
    if (
      !window.confirm(
        "Cancel this event? Anyone who marked interest will be notified."
      )
    )
      return;

    setBusy(true);
    try {
      await apiFetch(`/api/events/${id}`, { token, method: "DELETE" });
      router.push("/events");
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PageShell width="md">
        <div className="space-y-3" aria-busy="true">
          <div className="h-10 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </PageShell>
    );
  }

  if (!event) {
    return (
      <PageShell title="Event not found" width="md">
        <p className="hf-card p-6 text-sm text-gray-600">
          {error || "That event does not exist or has been removed."}
        </p>
        <Link href="/events" className="hf-btn hf-btn-primary mt-4">
          Back to events
        </Link>
      </PageShell>
    );
  }

  const cancelled = Boolean(event.cancelledAt);

  return (
    <PageShell width="md">
      <article className="hf-card overflow-hidden">
        <div className="border-b border-gray-200 p-6">
          {cancelled && (
            <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              This event has been cancelled.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/clubs/${event.club.id}/members`}
              className="text-sm font-semibold text-[var(--hf-green)] hover:underline"
            >
              {event.club.name}
            </Link>
            <KindBadge kind={event.club.kind} size="xs" />
          </div>

          <h1 className="mt-2 text-2xl font-bold text-black sm:text-3xl">
            {event.title}
          </h1>

          <dl className="mt-4 space-y-1 text-sm text-gray-700">
            <div className="flex gap-2">
              <dt className="font-semibold">When</dt>
              <dd>
                {formatDateTime(event.startsAt)}
                {event.endsAt && ` – ${formatDateTime(event.endsAt)}`}
              </dd>
            </div>
            {event.location && (
              <div className="flex gap-2">
                <dt className="font-semibold">Where</dt>
                <dd>{event.location}</dd>
              </div>
            )}
            {event.locationHidden && (
              <div className="flex gap-2">
                <dt className="font-semibold">Where</dt>
                <dd>
                  <LocationSharing compact onChange={() => load()} />
                </dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="font-semibold">Interested</dt>
              <dd>{event._count?.interests ?? 0}</dd>
            </div>
          </dl>

          {Array.isArray(event.tags) && event.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
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

        {event.description && (
          <div className="border-b border-gray-200 p-6">
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {event.description}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 p-6">
          {!cancelled && (
            <button
              type="button"
              onClick={toggleInterest}
              disabled={busy}
              className={`hf-btn ${
                event.viewerInterested ? "hf-btn-secondary" : "hf-btn-primary"
              }`}
            >
              {event.viewerInterested ? "Not interested" : "I'm interested!"}
            </button>
          )}

          {canManage && !cancelled && (
            <button
              type="button"
              onClick={cancelEvent}
              disabled={busy}
              className="hf-btn hf-btn-secondary text-red-700"
            >
              Cancel event
            </button>
          )}

          <ReportButton
            targetType="EVENT"
            targetId={event.id}
            targetLabel={event.title}
            className="ml-auto"
          />
        </div>
      </article>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <Link href="/events" className="hf-btn hf-btn-secondary mt-6">
        Back to events
      </Link>

      {prompt}
    </PageShell>
  );
}
