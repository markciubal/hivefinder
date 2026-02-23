'use client';
import React, { useEffect, useState } from 'react';
import Link from "next/link";
import Header from "../components/header/Header.jsx";
import InterestsSelector from "../components/interests/InterestsSelector.jsx";
import {
  friendFinderSampleFriends,
  friendFinderSampleSelf,
} from "@/lib/friendFinderSampleData";

export default function Page() {
  const [userSelf, setUserSelf] = useState({});
  const [allFriends, setAllFriends] = useState([]); // real users from API
  const [usingSampleData, setUsingSampleData] = useState(false);

  const [organizedFriends, setOrganizedFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [otherInterestsModal, setOtherInterestsModal] = useState(null);
  const [otherMembershipsModal, setOtherMembershipsModal] = useState(null);
  const [contactMethodsModal, setContactMethodsModal] = useState(null);

  const [selectedFilters, setSelectedFilters] = useState([]);
  const [filterMode, setFilterMode] = useState("or");
  const [editInterests, setEditInterests] = useState([]);
  const [savingInterests, setSavingInterests] = useState(false);
  const [interestsMessage, setInterestsMessage] = useState("");
  const [interestsError, setInterestsError] = useState("");
  const [addingFriendId, setAddingFriendId] = useState(null);
  const [friendActionError, setFriendActionError] = useState("");
  const [respondingFriendId, setRespondingFriendId] = useState(null);
  const [respondingFriendAction, setRespondingFriendAction] = useState("");

  const sharedStyle = "text-xxs m-[2px] px-1 py-1 bg-neutral-900 text-white rounded-md hover:bg-neutral-700! inline-block";
  const normalStyle = "text-xxs m-[2px] px-1 py-1 bg-neutral-300 text-black rounded-md hover:bg-neutral-200 inline-block";
  const counterStyle = "mx-1 inline-flex items-center justify-center w-3 h-3 p-2 text-xxxs font-semibold text-neutral-800 bg-[#f4c201] rounded-full position-relative top-0 left-0";
  const starStyle = "w-3 h-3 mx-0 shrink-0 text-yellow-400 transition peer-checked:scale-130 peer-checked:rotate-360 peer-checked:fill-yellow-400 peer-checked:stroke-yellow-400 fill-transparent stroke-gray-300 stroke-[3] cursor-pointer";

  const toggleFilterValue = (value) => {
    setSelectedFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const doesUserMatchValue = (user, value) =>
    user.sharedInterests?.includes(value) ||
    user.sharedClubs?.some((club) => club.club === value);

  const matchesFilterSet = (user, values, mode) => {
    if (!values || values.length === 0) return true;
    return mode === "and"
      ? values.every((value) => doesUserMatchValue(user, value))
      : values.some((value) => doesUserMatchValue(user, value));
  };

  const getMatchesForFilters = (values, mode) => {
    if (!values || values.length === 0) return organizedFriends;
    return organizedFriends.filter((user) => matchesFilterSet(user, values, mode));
  };

  const getCountForValue = (value) => {
    const nextFilters = selectedFilters.includes(value)
      ? selectedFilters
      : [...selectedFilters, value];
    return getMatchesForFilters(nextFilters, filterMode).length;
  };

  const contactTypeLabel = (method) => {
    if (!method) return "";
    if (method.type === "EMAIL") return "Email";
    if (method.type === "PHONE") return "Phone";
    if (method.type === "DISCORD") return "Discord";
    if (method.type === "OTHER") return method.label || "Other";
    return "Contact";
  };

  const getPreferredContact = (methods) => {
    if (!Array.isArray(methods) || methods.length === 0) return null;
    const preferred = methods.find((m) => m.preferred);
    return preferred || methods[0];
  };

  const fetchFriends = async (tokenOverride) => {
    const token =
      tokenOverride ??
      (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!token) return;

    try {
      const res = await fetch('/api/friends', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAllFriends(data);
    } catch (err) {
      console.error('Failed to refresh friends', err);
    }
  };

  const updateSelectedFiltersAfterInterests = (nextInterests, nextMemberships) => {
    const allowed = new Set([
      ...(Array.isArray(nextInterests) ? nextInterests : []),
      ...(Array.isArray(nextMemberships) ? nextMemberships.map((m) => m.club) : []),
    ]);
    setSelectedFilters((prev) => prev.filter((value) => allowed.has(value)));
  };

  const handleSaveInterests = async () => {
    setInterestsError("");
    setInterestsMessage("");

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setInterestsError("Log in to update interests.");
      return;
    }

    setSavingInterests(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interests: editInterests }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to update interests (status ${res.status})`);
      }

      const updated = await res.json();
      const nextInterests = Array.isArray(updated?.interests)
        ? updated.interests
        : editInterests;

      setUserSelf((prev) => {
        const next = {
          ...prev,
          interests: nextInterests,
        };
        updateSelectedFiltersAfterInterests(
          nextInterests,
          next.memberships || []
        );
        return next;
      });
      setInterestsMessage("Interests updated.");
    } catch (err) {
      console.error("Failed to update interests", err);
      setInterestsError(err.message || "Failed to update interests.");
    } finally {
      setSavingInterests(false);
    }
  };

  // Initialize self + load friends from DB
  useEffect(() => {
    async function init() {
      const storedUser =
        typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('user') || 'null')
          : null;

      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const isGuest = !token;

      let selfId = storedUser?.id || 'self';
      let selfUsername =
        storedUser?.username ||
        storedUser?.email?.split('@')[0] ||
        "guest";
      let selfInterests = [];
      let selfMemberships = [];
      let selfContactMethods = [];

      if (isGuest) {
        setUsingSampleData(true);
        setUserSelf({
          ...friendFinderSampleSelf,
          interests: [...friendFinderSampleSelf.interests],
          memberships: friendFinderSampleSelf.memberships.map((membership) => ({
            club: membership.club,
          })),
        });

        try {
          const res = await fetch('/api/friends?demo=1');
          if (!res.ok) throw new Error('Failed to load sample friends');
          const data = await res.json();
          setAllFriends(Array.isArray(data) ? data : friendFinderSampleFriends);
        } catch (err) {
          console.error(err);
          setAllFriends(friendFinderSampleFriends);
        }
        return;
      }

      // Load self profile + memberships from DB when logged in
      try {
        if (typeof window !== 'undefined') {
          if (token) {
            const [meRes, myClubsRes] = await Promise.all([
              fetch('/api/user/me', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
              }),
              fetch('/api/user/myClubs', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
              }),
            ]);

            if (meRes.ok) {
              const me = await meRes.json();
              selfId = me.id || selfId;
              selfUsername = me.username || me.email?.split('@')[0] || selfUsername;
              selfInterests = Array.isArray(me.interests) ? me.interests : [];
              selfContactMethods = Array.isArray(me.contactMethods)
                ? me.contactMethods
                : [];
            }

            if (myClubsRes.ok) {
              const memberships = await myClubsRes.json();
              selfMemberships = Array.isArray(memberships)
                ? memberships
                    .map((m) => ({ club: m?.club?.name || '' }))
                    .filter((m) => m.club)
                : [];
            }
          }
        }
      } catch (err) {
        console.error('Error loading self from /api/user/me', err);
      }

      setUsingSampleData(false);
      setUserSelf({
        id: selfId,
        username: selfUsername,
        interests: selfInterests,
        memberships: selfMemberships,
        contactMethods: selfContactMethods,
      });

      // Load other users from API
      try {
        if (token) {
          await fetchFriends(token);
        }
      } catch (err) {
        console.error(err);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (usingSampleData) return undefined;

    const pollFriends = async () => {
      await fetchFriends();
    };

    const intervalId = setInterval(pollFriends, 15000);
    return () => clearInterval(intervalId);
  }, [usingSampleData]);

  useEffect(() => {
    if (!userSelf?.interests || allFriends.length === 0) return;

    const matches = allFriends
      .filter(user => user.id !== userSelf.id)
      .map((user) => {
        const matchedInterests = (user.interests || []).filter((i) =>
          userSelf.interests.includes(i)
        );
        const matchedClubs = (user.memberships || []).filter((club) =>
          userSelf.memberships.some((c) => c.club === club.club)
        );

        return { ...user, matchedInterests, matchedClubs };
      })
      .filter((u) => u.matchedInterests.length > 0 || u.matchedClubs.length > 0);

    const organized = matches
      .map((user) => {
        const sharedInterests = (user.interests || []).filter((interest) =>
          userSelf.interests.includes(interest)
        );
        const sharedClubs = (user.memberships || []).filter((club) =>
          userSelf.memberships.map(c => c.club).includes(club.club)
        );
        return { ...user, sharedInterests, sharedClubs };
      })
      .sort(
        (a, b) =>
          (b.sharedInterests.length + b.sharedClubs.length) -
          (a.sharedInterests.length + a.sharedClubs.length)
      );

    setOrganizedFriends(organized);
  }, [userSelf, allFriends]);

  useEffect(() => {
    setEditInterests(Array.isArray(userSelf?.interests) ? userSelf.interests : []);
  }, [userSelf]);

  useEffect(() => {
    setFilteredFriends(getMatchesForFilters(selectedFilters, filterMode));
  }, [organizedFriends, selectedFilters, filterMode]);

  const handleAddFriend = async (friendId) => {
    setFriendActionError("");
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || usingSampleData) {
      setFriendActionError("Log in to add friends.");
      return;
    }

    setAddingFriendId(friendId);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to add friend (status ${res.status})`);
      }

      await fetchFriends(token);
    } catch (err) {
      console.error("Failed to add friend", err);
      setFriendActionError(err.message || "Failed to add friend.");
    } finally {
      setAddingFriendId(null);
    }
  };

  const handleRespondToFriend = async (friendId, action) => {
    setFriendActionError("");
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || usingSampleData) {
      setFriendActionError("Log in to manage friend requests.");
      return;
    }

    setRespondingFriendId(friendId);
    setRespondingFriendAction(action);
    try {
      const res = await fetch('/api/friends', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId, action }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to update request (status ${res.status})`);
      }

      await fetchFriends(token);
    } catch (err) {
      console.error("Failed to update friend request", err);
      setFriendActionError(err.message || "Failed to update request.");
    } finally {
      setRespondingFriendId(null);
      setRespondingFriendAction("");
    }
  };

  return (
    <>
      <Header />
      <div className="p-3">
        <div className="text-center">
          <h1 className="text-lg py-3 font-semibold text-black uppercase">
            Find Friends
          </h1>
          <div className="mb-3">
            <Link
              href="/networkGraphMode"
              className="text-sm font-semibold text-[#0b5a21] underline underline-offset-2 hover:text-[#084618]"
            >
              Open Network Graph Mode
            </Link>
          </div>
          {usingSampleData && (
            <p className="mb-3 text-xs text-gray-600">
              Showing sample matches for guest access. Log in to see real
              connections.
            </p>
          )}
          {/* Card grid: self + matches */}
          <div className="w-full flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl justify-center">
              <div className="text-center col-span-full">
                {userSelf?.interests && (
                  <div
                    key={"interests_" + userSelf.id}
                    className="col-span-full border-b border-gray-300 p-4 rounded-lg shadow-sm bg-neutral-100 text-center"
                  >
                    <h3 className="text-lg font-semibold text-black">
                      {userSelf.username}
                    </h3>
                    <h2 className="text-sm font-semibold text-black m-2">
                      Filter by Common Interests
                    </h2>
                    <details className="mb-3 rounded border border-gray-200 bg-white p-3 text-left">
                      <summary className="cursor-pointer text-sm font-semibold text-black">
                        Update Interests
                      </summary>
                      <div className="mt-3">
                        <InterestsSelector
                          selectedInterests={editInterests}
                          setSelectedInterests={setEditInterests}
                          title="Your Interests"
                          description="Update your interests to improve friend matching."
                          helperText="Click to add or remove interests:"
                          defaultOpen
                        />
                        {interestsError && (
                          <p className="mt-2 text-xs text-red-600">
                            {interestsError}
                          </p>
                        )}
                        {interestsMessage && (
                          <p className="mt-2 text-xs text-green-700">
                            {interestsMessage}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveInterests}
                          disabled={savingInterests}
                          className="mt-3 rounded bg-green-800 text-white px-4 py-2 text-xs font-semibold disabled:opacity-60"
                        >
                          {savingInterests ? "Updating..." : "Update Interests"}
                        </button>
                      </div>
                    </details>
                    {userSelf.interests.map((interest, index) => {
                      const count = getCountForValue(interest);
                      const style = count > 0 ? sharedStyle : normalStyle;

                      return (
                        <span key={index} className={style}>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              value={interest}
                              checked={selectedFilters.includes(interest)}
                              onChange={() => toggleFilterValue(interest)}
                              className="peer hidden"
                            />
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              className={starStyle}
                            >
                              <path d="M12 2l3.1 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l6.9-1L12 2z" />
                            </svg>
                            <span className={counterStyle}>{count}</span>
                            {interest}
                          </label>
                        </span>
                      );
                    })}

                    {userSelf?.memberships && (
                      <div key={"clubs_" + userSelf.id}>
                        <h2 className="text-sm font-semibold text-black m-2">
                          Filter by Common Memberships
                        </h2>
                        {userSelf.memberships.map((membership) => {
                          const count = getCountForValue(membership.club);
                          const style = count > 0 ? sharedStyle : normalStyle;
                          return (
                            <span
                              key={"user_" + userSelf.id + "_" + membership.club}
                              className={style}
                            >
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  value={membership.club}
                                  checked={selectedFilters.includes(membership.club)}
                                  onChange={() => toggleFilterValue(membership.club)}
                                  className="peer hidden"
                                />
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  className={starStyle}
                                >
                                  <path d="M12 2l3.1 6.3L22 9.3l-5 4.9L18.2 21 12 17.8 5.8 21 7 14.2 2 9.3l6.9-1L12 2z" />
                                </svg>
                                <span className={counterStyle}>
                                  {count}
                                </span>
                                {membership.club}
                              </label>
                            </span>
                          );
                        })}

                        <div className="flex pt-4 justify-center">
                          <label className="mr-2 mt-2">Filter by:</label>
                          <select
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value)}
                            id="andor"
                            name="andor"
                            className="border justify-center text-black border-gray-300 rounded-md p-2 mb-4 w-25"
                          >
                            <option value="or">OR</option>
                            <option value="and">AND</option>
                          </select>
                        </div>

                        <div className="w-full text-center">
                          <p className="text-black">
                            We found <b>{filteredFriends.length}</b> friends:
                          </p>
                          {friendActionError && (
                            <p className="mt-2 text-xs text-red-600">
                              {friendActionError}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Friend cards – tile as grid items */}
              {organizedFriends &&
                filteredFriends.map((user) => {
                  const matchedInterests = (user.interests || []).filter((interest) =>
                    user.sharedInterests?.includes(interest)
                  );
                  const otherInterests = (user.interests || []).filter(
                    (interest) => !user.sharedInterests?.includes(interest)
                  );

                  const matchedMemberships = (user.memberships || []).filter(
                    (membership) => user.sharedClubs?.includes(membership)
                  );
                  const otherMemberships = (user.memberships || []).filter(
                    (membership) => !user.sharedClubs?.includes(membership)
                  );
                  const friendStatus =
                    user.friendStatus || (user.isFriend ? "accepted" : "none");
                  const isIncoming = friendStatus === "incoming";
                  const isOutgoing = friendStatus === "outgoing";
                  const isAccepted = friendStatus === "accepted";
                  const preferredContact = getPreferredContact(user.contactMethods);
                  const hasContacts =
                    Array.isArray(user.contactMethods) &&
                    user.contactMethods.length > 0;
                  const canViewContactInfo = isAccepted && hasContacts;

                  return (
                    <div
                      key={"user_" + user.id}
                      className="border border-gray-300 p-4 rounded-lg shadow-sm bg-neutral-100 w-full h-full flex flex-col"
                    >
                      <h3 className="text-md font-semibold text-black">
                        {user.username}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {isAccepted && user.about
                          ? user.about
                          : "About info available to approved friends."}
                      </p>

                      {/* Interests */}
                      <h4 className="text-sm text-gray-600">Interests</h4>

                      {matchedInterests.map((interest, index) => {
                        const style = sharedStyle;
                        return (
                          <span
                            key={index}
                            className={`${style} text-[0.7rem]`}
                          >
                            {interest}
                          </span>
                        );
                      })}

                      {otherInterests.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setOtherInterestsModal({
                              username: user.username,
                              interests: otherInterests,
                            })
                          }
                          className="mt-2 inline-flex justify-center items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
                        >
                          More interests
                        </button>
                      )}

                      {/* Memberships / Clubs */}
                      <h4 className="mt-3 text-sm text-gray-600">Memberships</h4>

                      {matchedMemberships.map((membership, index) => {
                        const style = sharedStyle;
                        return (
                          <span
                            key={index}
                            className={`${style} text-[0.7rem]`}
                          >
                            {membership.club}
                          </span>
                        );
                      })}

                      {otherMemberships.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setOtherMembershipsModal({
                              username: user.username,
                              memberships: otherMemberships,
                            })
                          }
                          className="mt-2 inline-flex justify-center items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-gray-100"
                        >
                          More clubs
                        </button>
                      )}

                      {isAccepted && preferredContact && (
                        <p className="mt-3 text-xs text-gray-600">
                          Preferred contact:{" "}
                          <span className="font-semibold">
                            {contactTypeLabel(preferredContact)}
                          </span>{" "}
                          {preferredContact.value}
                        </p>
                      )}

                      {canViewContactInfo && (
                        <button
                          type="button"
                          onClick={() =>
                            setContactMethodsModal({
                              username: user.username,
                              contactMethods: user.contactMethods,
                            })
                          }
                          className="mt-2 inline-flex justify-center items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-gray-100"
                        >
                          View Contact Info
                        </button>
                      )}

                      {isAccepted ? (
                        <button
                          type="button"
                          disabled
                          className="mt-2 inline-flex justify-center items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-gray-700 shadow-sm opacity-60"
                        >
                          Friends
                        </button>
                      ) : isIncoming ? (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRespondToFriend(user.id, "accept")}
                            disabled={respondingFriendId === user.id}
                            className="inline-flex justify-center items-center gap-1 rounded-md border border-green-700 bg-green-800 px-2 py-1 text-[0.7rem] font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                          >
                            {respondingFriendId === user.id &&
                            respondingFriendAction === "accept"
                              ? "Accepting..."
                              : "Accept"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespondToFriend(user.id, "reject")}
                            disabled={respondingFriendId === user.id}
                            className="inline-flex justify-center items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                          >
                            {respondingFriendId === user.id &&
                            respondingFriendAction === "reject"
                              ? "Declining..."
                              : "Decline"}
                          </button>
                        </div>
                      ) : isOutgoing ? (
                        <button
                          type="button"
                          disabled
                          className="mt-2 inline-flex justify-center items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-gray-700 shadow-sm opacity-60"
                        >
                          Request Sent
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddFriend(user.id)}
                          disabled={addingFriendId === user.id}
                          className="mt-2 inline-flex justify-center items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[0.7rem] font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                        >
                          {addingFriendId === user.id ? "Adding..." : "Add Friend"}
                        </button>
                      )}

                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Modals unchanged */}
        {otherInterestsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="max-w-md w-full mx-4 rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Other interests for {otherInterestsModal.username}
                </h3>
                <button
                  type="button"
                  onClick={() => setOtherInterestsModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>

              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {otherInterestsModal.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className={`${normalStyle} text-[0.7rem] px-2 py-1`}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-200 px-4 py-2">
                <button
                  type="button"
                  onClick={() => setOtherInterestsModal(null)}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {otherMembershipsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="max-w-md w-full mx-4 rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Other clubs for {otherMembershipsModal.username}
                </h3>
                <button
                  type="button"
                  onClick={() => setOtherMembershipsModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>

              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {otherMembershipsModal.memberships.map((membership, idx) => (
                    <span
                      key={idx}
                      className={`${normalStyle} text-[0.7rem] px-2 py-1`}
                    >
                      {membership.club}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-200 px-4 py-2">
                <button
                  type="button"
                  onClick={() => setOtherMembershipsModal(null)}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {contactMethodsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="max-w-md w-full mx-4 rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Contact methods for {contactMethodsModal.username}
                </h3>
                <button
                  type="button"
                  onClick={() => setContactMethodsModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  x
                </button>
              </div>

              <div className="px-4 py-3 space-y-2">
                {contactMethodsModal.contactMethods.map((method, idx) => (
                  <div
                    key={`${method.type}-${method.value}-${idx}`}
                    className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-xs"
                  >
                    <span className="font-semibold">
                      {contactTypeLabel(method)}
                      {method.preferred ? " (Preferred)" : ""}
                    </span>
                    <span className="text-gray-700">{method.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-gray-200 px-4 py-2">
                <button
                  type="button"
                  onClick={() => setContactMethodsModal(null)}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

