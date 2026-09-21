"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageShell from "../../../components/layout/PageShell";
import RequireAuth from "../../../components/auth/RequireAuth";
import KindBadge from "../../../components/clubs/KindBadge";
import ReportButton from "../../../components/moderation/ReportButton";
import EventCard from "../../../components/events/EventCard";
import { useAuth } from "../../../components/auth/AuthProvider";
import { apiFetch } from "../../../lib/apiClient";
import { CAMPUS_GROUPS_LOGIN, OFFICIAL } from "../../../lib/clubKind";

function RoleBadge({ role }) {
  return role === "OFFICER" ? (
    <span className="rounded-full border border-[var(--hf-green)] bg-[var(--hf-green)]/10 px-2 py-0.5 text-xxs font-bold text-[var(--hf-green)]">
      Officer
    </span>
  ) : (
    <span className="rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-xxs font-semibold text-gray-600">
      Member
    </span>
  );
}

/**
 * A club's roster and upcoming events.
 *
 * Officers get promote / demote / remove controls. The server refuses to leave
 * a club with no officers, and the UI mirrors that by disabling the controls on
 * the last one rather than letting someone click into a 409.
 */
function Roster() {
  const { clubId } = useParams();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/clubs/${clubId}/members`, { token });
      setData(res);
      setClub(res.club);
      setError("");
    } catch (e) {
      // A 403 still carries the club, so non-members see what they would be
      // joining instead of a bare error.
      if (e.data?.club) setClub(e.data.club);
      setError(e.message || "Could not load the roster.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [clubId, token]);

  useEffect(() => {
    load();
  }, [load]);

  // Events are public, so they load even when the roster is forbidden.
  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/events?clubId=${clubId}&scope=upcoming`)
      .then((res) => !cancelled && setEvents(Array.isArray(res) ? res : []))
      .catch(() => !cancelled && setEvents([]));
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  const officerCount = useMemo(
    () => (data?.members || []).filter((m) => m.role === "OFFICER").length,
    [data]
  );

  async function setRole(member, role) {
    setBusyId(member.userId);
    setNotice("");
    try {
      await apiFetch(`/api/clubs/${clubId}/members/${member.userId}`, {
        token,
        method: "PATCH",
        body: { role },
      });
      setNotice(
        role === "OFFICER"
          ? `${member.user.username} is now an officer.`
          : `${member.user.username} is now a member.`
      );
      await load();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(member) {
    if (!window.confirm(`Remove ${member.user.username} from ${club?.name}?`)) {
      return;
    }
    setBusyId(member.userId);
    setNotice("");
    try {
      await apiFetch(`/api/clubs/${clubId}/members/${member.userId}`, {
        token,
        method: "DELETE",
      });
      setNotice(`${member.user.username} was removed.`);
      await load();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <PageShell width="md">
        <div className="space-y-3" aria-busy="true">
          <div className="h-10 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </PageShell>
    );
  }

  if (!club) {
    return (
      <PageShell title="Club not found" width="md">
        <p className="hf-card p-6 text-sm text-gray-600">{error}</p>
      </PageShell>
    );
  }

  // Official clubs are run on CampusGroups, so there is no roster or event
  // list to show here - only a signpost. Hives are the part this app manages.
  if (club.kind === OFFICIAL) {
    return (
      <PageShell title={club.name} description={club.description || undefined} width="md">
        <div className="hf-card p-8 text-center">
          <KindBadge kind={OFFICIAL} withBlurb />
          <h2 className="mt-4 font-semibold text-black">
            Managed on CampusGroups
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Sacramento State handles membership, officers and events for
            recognized clubs. HiveFinder just helps you find them.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <a
              href={CAMPUS_GROUPS_LOGIN}
              target="_blank"
              rel="noopener noreferrer"
              className="hf-btn hf-btn-primary"
            >
              Open on CampusGroups <span aria-hidden="true">↗</span>
            </a>
            <Link href="/hives" className="hf-btn hf-btn-secondary">
              Browse hives
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const canManage = Boolean(data?.canManage);

  return (
    <PageShell
      title={club.name}
      description={club.description || undefined}
      width="md"
      actions={
        canManage ? (
          <Link href="/createEvent" className="hf-btn hf-btn-primary">
            Post an event
          </Link>
        ) : null
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <KindBadge kind={club.kind} withBlurb />
        {data?.viewerRole && <RoleBadge role={data.viewerRole} />}
        <ReportButton
          targetType="CLUB"
          targetId={club.id}
          targetLabel={club.name}
          label={`Report this ${club.kind === "OFFICIAL" ? "club" : "hive"}`}
          className="ml-auto"
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-black">Upcoming events</h2>
        {events.length === 0 ? (
          <p className="hf-card p-5 text-sm text-gray-600">
            Nothing scheduled.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} showClub={false} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-black">Members</h2>
          {data && (
            <span className="text-sm text-gray-500">
              {data.members.length} total · {officerCount} officer
              {officerCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {!data && (
          <div className="hf-card p-6 text-center">
            <p className="text-sm text-gray-600">{error}</p>
            <Link
              href="/hives"
              className="hf-btn hf-btn-primary mt-4"
            >
              Find it in the directory
            </Link>
          </div>
        )}

        {notice && (
          <p className="mb-3 rounded-lg border border-gray-200 bg-[var(--hf-surface-alt)] px-3 py-2 text-sm text-gray-800">
            {notice}
          </p>
        )}

        {data && (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {data.members.map((m) => {
              const isSelf = m.userId === data.viewerId;
              const isLastOfficer = m.role === "OFFICER" && officerCount <= 1;
              const busy = busyId === m.userId;
              const name =
                [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") ||
                m.user.username;

              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-black">{name}</span>
                      <RoleBadge role={m.role} />
                      {isSelf && (
                        <span className="text-xxs text-gray-500">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">@{m.user.username}</p>
                  </div>

                  <div className="flex flex-none flex-wrap gap-2">
                    {!isSelf && !m.blocked && (
                      <Link
                        href={`/messages/new?to=${m.userId}&name=${encodeURIComponent(
                          m.user.username || ""
                        )}`}
                        className="hf-btn hf-btn-secondary"
                      >
                        Message
                      </Link>
                    )}

                    {canManage &&
                      (m.role === "OFFICER" ? (
                        <button
                          type="button"
                          onClick={() => setRole(m, "MEMBER")}
                          disabled={busy || isLastOfficer}
                          title={
                            isLastOfficer
                              ? "A club needs at least one officer"
                              : undefined
                          }
                          className="hf-btn hf-btn-secondary"
                        >
                          {isSelf ? "Step down" : "Make member"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRole(m, "OFFICER")}
                          disabled={busy}
                          className="hf-btn hf-btn-primary"
                        >
                          Make officer
                        </button>
                      ))}

                    {canManage && !isSelf && (
                      <button
                        type="button"
                        onClick={() => remove(m)}
                        disabled={busy || isLastOfficer}
                        className="hf-btn hf-btn-secondary text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

export default function ClubMembersPage() {
  return (
    <RequireAuth what="club rosters">
      <Roster />
    </RequireAuth>
  );
}
