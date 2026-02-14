"use client";

import React, { useEffect, useMemo, useState } from "react";
import NetworkGraphCanvas from "./NetworkGraphCanvas";

function getDisplayName(user) {
  return user?.username || user?.email?.split("@")[0] || "You";
}

const graphTerms = [
  {
    term: "Closest Connections",
    description:
      "The 10 users with the highest overlap score against your profile.",
  },
  {
    term: "Strength",
    description:
      "How strong your match is with a user (shared interests + shared clubs).",
  },
  {
    term: "Shared Links",
    description:
      "Links between two of your closest connections when they overlap with each other.",
  },
  {
    term: "Contour Events",
    description:
      "Current label used in the graph legend for shared-link relationships.",
  },
  {
    term: "Shared Interests",
    description:
      "Interests you and a selected connection both have; viewable from the node context menu.",
  },
];

export default function NetworkGraphMode() {
  const [selfUser, setSelfUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const storedUser =
          typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user") || "null")
            : null;
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        let me = storedUser;
        if (token) {
          const [meRes, myClubsRes] = await Promise.all([
            fetch("/api/user/me", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/user/myClubs", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (meRes.ok) {
            me = await meRes.json();
          }

          if (myClubsRes.ok) {
            const memberships = await myClubsRes.json();
            me = {
              ...me,
              memberships: Array.isArray(memberships)
                ? memberships
                    .map((membership) => ({
                      club: membership?.club?.name || "",
                    }))
                    .filter((membership) => membership.club)
                : [],
            };
          }
        }

        if (!me) {
          setError("Log in to view your network graph.");
          setLoading(false);
          return;
        }

        setSelfUser(me);

        const friendsRes = await fetch("/api/friends");
        if (!friendsRes.ok) {
          throw new Error("Could not load friend network.");
        }
        const data = await friendsRes.json();
        setFriends(Array.isArray(data) ? data : []);
      } catch {
        setError("Could not load network graph right now.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const graphNodes = useMemo(() => {
    if (!selfUser) return [];

    const selfInterests = Array.isArray(selfUser.interests)
      ? selfUser.interests
      : [];
    const selfClubs = Array.isArray(selfUser.memberships)
      ? selfUser.memberships.map((club) => club.club)
      : [];
    const selfInterestSet = new Set(selfInterests);
    const selfClubSet = new Set(selfClubs);

    const closestProfiles = friends
      .filter((friend) => friend.id !== selfUser.id)
      .map((friend) => {
        const friendInterests = Array.isArray(friend.interests)
          ? friend.interests
          : [];
        const friendClubs = Array.isArray(friend.memberships)
          ? friend.memberships.map((membership) => membership.club)
          : [];

        const sharedInterestsWithSelf = friendInterests.filter((interest) =>
          selfInterestSet.has(interest)
        );
        const sharedClubsWithSelf = friendClubs.filter((club) =>
          selfClubSet.has(club)
        );
        const commonInterests = sharedInterestsWithSelf.length;
        const commonClubs = sharedClubsWithSelf.length;

        return {
          id: friend.id,
          label: getDisplayName(friend),
          weight: commonInterests + commonClubs,
          sharedInterests: sharedInterestsWithSelf,
          sharedClubs: sharedClubsWithSelf,
          interests: friendInterests,
          clubs: friendClubs,
        };
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    return closestProfiles.map((profile, index) => {
      const profileInterestSet = new Set(profile.interests);
      const profileClubSet = new Set(profile.clubs);

      const sharedConnections = closestProfiles
        .filter((otherProfile, otherIndex) => otherIndex !== index)
        .map((otherProfile) => {
          const sharedInterests = otherProfile.interests.filter((interest) =>
            profileInterestSet.has(interest)
          ).length;
          const sharedClubs = otherProfile.clubs.filter((club) =>
            profileClubSet.has(club)
          ).length;
          const sharedWeight = sharedInterests + sharedClubs;

          return {
            id: otherProfile.id,
            weight: sharedWeight,
          };
        })
        .filter((connection) => connection.weight > 0);

      return {
        id: profile.id,
        label: profile.label,
        weight: profile.weight,
        sharedInterests: profile.sharedInterests,
        sharedClubs: profile.sharedClubs,
        sharedConnections,
      };
    });
  }, [friends, selfUser]);

  if (loading) {
    return <p className="text-sm text-gray-600">Loading network graph...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 rounded-2xl bg-[#c4ceb2] p-5">
        <h1 className="text-2xl font-bold text-black">Network Graph Mode</h1>
        <p className="mt-2 text-sm text-gray-700">
          Visual map of your strongest friend matches based on shared interests
          and club memberships.
        </p>
      </div>

      {graphNodes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
          No network edges yet. Add interests, join clubs, or connect with more
          people in Friend Finder.
        </div>
      ) : (
        <>
          <NetworkGraphCanvas
            centerLabel={getDisplayName(selfUser)}
            nodes={graphNodes}
          />
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Top Matches
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-800">
              {graphNodes.map((node) => (
                <li key={`legend-${node.id}`}>
                  {node.label}: {node.weight} strength,{" "}
                  {node.sharedConnections.length} shared links
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="mt-6 rounded-2xl border border-[#a9b79a] bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          Terminology
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {graphTerms.map((item) => (
            <div
              key={item.term}
              className="rounded-xl border border-gray-200 bg-[#f5f7f1] p-3"
            >
              <p className="text-sm font-bold text-gray-900">{item.term}</p>
              <p className="mt-1 text-xs text-gray-700">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
