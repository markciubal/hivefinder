"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../components/layout/PageShell";
import { DemoBanner } from "../components/auth/RequireAuth";
import { useSignInPrompt } from "../components/auth/SignInPrompt";
import { useAuth } from "../components/auth/AuthProvider";
import { DEMO_PROFILE, DEMO_FRIENDS } from "../lib/demoData";

const sharedStyle =
  "text-xxs m-[2px] px-1 py-1 bg-neutral-900 text-white rounded-md inline-block";
const normalStyle =
  "text-xxs m-[2px] px-1 py-1 bg-neutral-300 text-black rounded-md inline-block";
const counterStyle =
  "mx-1 inline-flex items-center justify-center w-3 h-3 p-2 text-xxxs font-semibold text-neutral-800 bg-[var(--hf-honey)] rounded-full";
const starStyle =
  "w-3 h-3 mx-0 shrink-0 text-yellow-400 transition peer-checked:scale-130 peer-checked:fill-yellow-400 peer-checked:stroke-yellow-400 fill-transparent stroke-gray-300 stroke-[3] cursor-pointer";

function StarCheckbox({ value, checked, onChange, count, label }) {
  return (
    <span className={sharedStyle}>
      <label className="flex items-center">
        <input
          type="checkbox"
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="peer hidden"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={starStyle}
          aria-hidden="true"
        >
          <path d="M12 2l3.1 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l6.9-1L12 2z" />
        </svg>
        <span className={counterStyle}>{count}</span>
        {label}
      </label>
    </span>
  );
}

function ListModal({ title, items, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>&#10005;
          </button>
        </div>
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {items.map((item, idx) => (
              <span key={idx} className={`${normalStyle} px-2 py-1`}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-end border-t border-gray-200 px-4 py-2">
          <button type="button" onClick={onClose} className="hf-btn hf-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The matching view. Works identically for real and demo data — the page just
 * decides which `self` and `friends` to hand it.
 */
function FriendFinderView({ self, friends, onMessage }) {
  const [checked, setChecked] = useState([]);
  const [combineMode, setCombineMode] = useState("or");
  const [modal, setModal] = useState(null);

  const selfClubs = useMemo(
    () => (self?.memberships || []).map((m) => m.club),
    [self]
  );

  const { organized, stats } = useMemo(() => {
    const interestCounts = new Map();
    const clubCounts = new Map();

    const matches = (friends || [])
      .filter((u) => u.id !== self?.id)
      .map((user) => {
        const sharedInterests = (user.interests || []).filter((i) =>
          (self?.interests || []).includes(i)
        );
        const sharedClubs = (user.memberships || []).filter((m) =>
          selfClubs.includes(m.club)
        );

        sharedInterests.forEach((name) =>
          interestCounts.set(name, (interestCounts.get(name) || 0) + 1)
        );
        sharedClubs.forEach(({ club }) =>
          clubCounts.set(club, (clubCounts.get(club) || 0) + 1)
        );

        return { ...user, sharedInterests, sharedClubs };
      })
      .filter((u) => u.sharedInterests.length > 0 || u.sharedClubs.length > 0)
      .sort(
        (a, b) =>
          b.sharedInterests.length +
          b.sharedClubs.length -
          (a.sharedInterests.length + a.sharedClubs.length)
      );

    return { organized: matches, stats: { interestCounts, clubCounts } };
  }, [friends, self, selfClubs]);

  const filtered = useMemo(() => {
    if (checked.length === 0) return organized;

    const test = (user, term) =>
      user.sharedInterests.includes(term) ||
      user.sharedClubs.some((c) => c.club === term);

    return combineMode === "and"
      ? organized.filter((u) => checked.every((t) => test(u, t)))
      : organized.filter((u) => checked.some((t) => test(u, t)));
  }, [organized, checked, combineMode]);

  const toggle = (value) =>
    setChecked((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  if (!self) return null;

  return (
    <>
      <section className="hf-card mb-6 bg-neutral-100 p-5 text-center">
        <h2 className="text-lg font-semibold text-black">{self.username}</h2>

        <h3 className="m-2 text-sm font-semibold text-black">
          Filter by common interests
        </h3>
        <div className="flex flex-wrap justify-center">
          {(self.interests || []).map((interest) => (
            <StarCheckbox
              key={interest}
              value={interest}
              label={interest}
              checked={checked.includes(interest)}
              onChange={toggle}
              count={stats.interestCounts.get(interest) || 0}
            />
          ))}
        </div>

        <h3 className="m-2 text-sm font-semibold text-black">
          Filter by common memberships
        </h3>
        <div className="flex flex-wrap justify-center">
          {(self.memberships || []).map((membership) => (
            <StarCheckbox
              key={membership.club}
              value={membership.club}
              label={membership.club}
              checked={checked.includes(membership.club)}
              onChange={toggle}
              count={stats.clubCounts.get(membership.club) || 0}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <label htmlFor="andor" className="text-sm">
            Match:
          </label>
          <select
            id="andor"
            value={combineMode}
            onChange={(e) => setCombineMode(e.target.value)}
            className="hf-input w-28"
          >
            <option value="or">Any (OR)</option>
            <option value="and">All (AND)</option>
          </select>
        </div>

        <p className="mt-4 text-black">
          We found <b>{filtered.length}</b>{" "}
          {filtered.length === 1 ? "student" : "students"}.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((user) => {
          const otherInterests = (user.interests || []).filter(
            (i) => !user.sharedInterests.includes(i)
          );
          const otherMemberships = (user.memberships || []).filter(
            (m) => !user.sharedClubs.includes(m)
          );

          return (
            <article
              key={user.id}
              className="hf-card flex h-full flex-col bg-neutral-100 p-4"
            >
              <h3 className="font-semibold text-black">{user.username}</h3>

              <h4 className="mt-2 text-sm text-gray-600">Shared interests</h4>
              <div className="flex flex-wrap">
                {user.sharedInterests.map((interest) => (
                  <span key={interest} className={sharedStyle}>
                    {interest}
                  </span>
                ))}
              </div>

              {otherInterests.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setModal({
                      title: `Other interests for ${user.username}`,
                      items: otherInterests,
                    })
                  }
                  className="mt-2 self-start rounded-md border border-gray-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-gray-700 hover:bg-gray-50"
                >
                  More interests
                </button>
              )}

              <h4 className="mt-3 text-sm text-gray-600">Shared clubs</h4>
              <div className="flex flex-wrap">
                {user.sharedClubs.map((m) => (
                  <span key={m.club} className={sharedStyle}>
                    {m.club}
                  </span>
                ))}
                {user.sharedClubs.length === 0 && (
                  <span className="text-xs text-gray-500">None in common</span>
                )}
              </div>

              {otherMemberships.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setModal({
                      title: `Other clubs for ${user.username}`,
                      items: otherMemberships.map((m) => m.club),
                    })
                  }
                  className="mt-2 self-start rounded-md border border-gray-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-gray-700 hover:bg-gray-50"
                >
                  More clubs
                </button>
              )}

              <button
                type="button"
                onClick={() => onMessage(user)}
                className="hf-btn hf-btn-primary mt-4 w-full"
              >
                Message {user.username}
              </button>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div className="hf-card col-span-full p-8 text-center">
            <p className="text-sm text-gray-600">
              No students match those filters yet.
            </p>
          </div>
        )}
      </div>

      {modal && (
        <ListModal
          title={modal.title}
          items={modal.items}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

export default function FriendFinderPage() {
  const router = useRouter();
  const { token, status, isAuthenticated } = useAuth();
  const { promptSignIn, prompt } = useSignInPrompt();

  // Only the signed-in case needs fetching. The demo case is derived below,
  // so there is no effect writing sample data into state on mount.
  const [remote, setRemote] = useState(null);

  useEffect(() => {
    if (status === "loading" || !isAuthenticated) return;

    let cancelled = false;

    (async () => {
      let me = null;
      try {
        const res = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) me = await res.json();
      } catch (e) {
        console.error("Could not load your profile", e);
      }

      let others = [];
      try {
        // Send the token so people blocked in either direction are left out.
        const res = await fetch("/api/friends", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) others = await res.json();
      } catch (e) {
        console.error("Could not load other students", e);
      }

      if (cancelled) return;

      setRemote({
        self: {
          id: me?.id || "self",
          username: me?.username || "You",
          interests: me?.interests || [],
          memberships: me?.memberships || [],
        },
        friends: Array.isArray(others) ? others : [],
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [status, isAuthenticated, token]);

  const self = isAuthenticated ? remote?.self ?? null : DEMO_PROFILE;
  const friends = isAuthenticated ? remote?.friends ?? [] : DEMO_FRIENDS;
  const loading = status === "loading" || (isAuthenticated && !remote);

  const noInterests =
    isAuthenticated && self && (self.interests || []).length === 0;

  return (
    <PageShell
      title="Friend Finder"
      description="Students who share your interests and club memberships."
      width="lg"
    >
      {!isAuthenticated && status !== "loading" && (
        <DemoBanner
          what="Friend Finder"
          reason="These are sample students matched against a sample profile. Sign in to match against your own interests and clubs."
        />
      )}

      {noInterests && (
        <div className="mb-6 rounded-xl border border-[var(--hf-sage-dark)] bg-[var(--hf-sage)] p-4 text-sm text-black/80">
          Add a few interests to your account and matches will show up here.{" "}
          <a href="/account" className="font-semibold underline">
            Edit your interests
          </a>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      ) : (
        <FriendFinderView
          key={self?.id}
          self={self}
          friends={friends}
          onMessage={(user) => {
            if (!isAuthenticated) {
              promptSignIn("messaging other students");
              return;
            }
            // Opens an empty composer; the thread is only created once the
            // first message is actually sent.
            const qs = new URLSearchParams({
              to: user.id,
              name: user.username || "",
            });
            router.push(`/messages/new?${qs}`);
          }}
        />
      )}

      {prompt}
    </PageShell>
  );
}
