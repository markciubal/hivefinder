'use client';
import React, { useEffect, useState } from 'react';
import Header from "../components/header/Header.jsx";
import interests from '../../utilities/interests.json';
// removed dummy users
// import users_500 from '../../utilities/users_500.json';

function getRandomInterests(interests, count) {
  const shuffled = [...interests].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).sort();
}

export default function Page() {
  const [userSelf, setUserSelf] = useState({});
  const [allFriends, setAllFriends] = useState([]); // real users from API

  const [organizedFriends, setOrganizedFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [clubFriends, setClubFriends] = useState([]);
  const [matchedStatistics, setMatchedStatistics] = useState({ interests: [], memberships: [] });

  const [otherInterestsModal, setOtherInterestsModal] = useState(null);
  const [otherMembershipsModal, setOtherMembershipsModal] = useState(null);

  const sharedStyle = "text-xxs m-[2px] px-1 py-1 bg-neutral-900 text-white rounded-md hover:bg-neutral-700! inline-block";
  const normalStyle = "text-xxs m-[2px] px-1 py-1 bg-neutral-300 text-black rounded-md hover:bg-neutral-200 inline-block";
  const counterStyle = "mx-1 inline-flex items-center justify-center w-3 h-3 p-2 text-xxxs font-semibold text-neutral-800 bg-[#f4c201] rounded-full position-relative top-0 left-0";
  const starStyle = "w-3 h-3 mx-0 shrink-0 text-yellow-400 transition peer-checked:scale-130 peer-checked:rotate-360 peer-checked:fill-yellow-400 peer-checked:stroke-yellow-400 fill-transparent stroke-gray-300 stroke-[3] cursor-pointer";

  const handleFilterChange = (event) => {
    const selectedSimilarities = document.querySelectorAll('input[name="checkbox"]:checked');
    const selectedSimilaritiesArray = Array.from(selectedSimilarities).map(input => input.value);

    if (selectedSimilaritiesArray.length > 0) {
      setFilteredFriends(
        document.querySelector('select[name="andor"]').value === "and"
          ? organizedFriends.filter((user) =>
              selectedSimilaritiesArray.every(
                (sim) =>
                  user.sharedInterests.includes(sim) ||
                  user.sharedClubs.some((club) => club.club === sim)
              )
            )
          : organizedFriends.filter((user) =>
              selectedSimilaritiesArray.some(
                (sim) =>
                  user.sharedInterests.includes(sim) ||
                  user.sharedClubs.some((club) => club.club === sim)
              )
            )
      );
    } else {
      setFilteredFriends(organizedFriends);
    }
  };

  // Initialize self + load friends from DB
  useEffect(() => {
    async function init() {
      // Default self interests = random if we can't load real ones
      const randomInterests = getRandomInterests(interests, 10);

      const storedUser =
        typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('user') || 'null')
          : null;

      let selfId = storedUser?.id || 'self';
      let selfUsername =
        storedUser?.username ||
        storedUser?.email?.split('@')[0] ||
        "demoUser";
      let selfInterests = randomInterests;

      // Try to load real self interests from /api/user/me if logged in
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            const meRes = await fetch('/api/user/me', {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (meRes.ok) {
              const me = await meRes.json();
              selfId = me.id || selfId;
              selfUsername = me.username || selfUsername;
              if (Array.isArray(me.interests) && me.interests.length > 0) {
                selfInterests = me.interests;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading self from /api/user/me', err);
      }

      setUserSelf({
        id: selfId,
        username: selfUsername,
        interests: selfInterests,
        // memberships still demo until wired to real DB
        memberships: [
          { club: "Men's Soccer Club" },
          { club: "The Belonging Collective" },
        ],
      });

      // Load other users from API
      try {
        const res = await fetch('/api/friends');
        if (!res.ok) throw new Error('Failed to load friends');
        const data = await res.json();
        setAllFriends(data);
      } catch (err) {
        console.error(err);
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (!userSelf?.interests || allFriends.length === 0) return;

    const matchedStats = { interests: [], memberships: [] };

    const matches = allFriends
      .filter(user => user.id !== userSelf.id)
      .map((user) => {
        const matchedInterests = (user.interests || []).filter((i) =>
          userSelf.interests.includes(i)
        );
        const matchedClubs = (user.memberships || []).filter((club) =>
          userSelf.memberships.some((c) => c.club === club.club)
        );

        // update interest counts
        matchedInterests.forEach((name) => {
          const node = matchedStats.interests.find((x) => x.name === name);
          if (node) node.count += 1;
          else matchedStats.interests.push({ name, count: 1 });
        });

        // update club counts
        matchedClubs.forEach(({ club }) => {
          const node = matchedStats.memberships.find((x) => x.club === club);
          if (node) node.count += 1;
          else matchedStats.memberships.push({ club, count: 1 });
        });

        return { ...user, matchedInterests, matchedClubs };
      })
      .filter((u) => u.matchedInterests.length > 0 || u.matchedClubs.length > 0);

    setMatchedStatistics(matchedStats);
    setClubFriends(matches);

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
    setFilteredFriends(organized);
  }, [userSelf, allFriends]);

  return (
    <>
      <Header />
      <div className="p-3">
        <div className="text-center">
          <h1 className="text-lg py-3 font-semibold text-black uppercase">
            Find Friends
          </h1>
          {/* Card grid: self + matches */}
          <div className="w-full flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl justify-center">
              <div className="text-center col-span-full">
                {userSelf?.interests && matchedStatistics && (
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
                    {userSelf.interests.map((interest, index) => {
                      const isShared = matchedStatistics.interests.some(
                        (i) => i.name === interest
                      );
                      const style = isShared ? sharedStyle : normalStyle;
                      const count =
                        matchedStatistics.interests.find((i) => i.name === interest)
                          ?.count || 0;

                      return (
                        <span key={index} className={style}>
                          <label className="flex items-center">
                            <input
                              name="checkbox"
                              type="checkbox"
                              value={interest}
                              onChange={handleFilterChange}
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
                        {userSelf.memberships.map((membership, index) => {
                          const style = sharedStyle;
                          return (
                            <span
                              key={"user_" + userSelf.id + "_" + membership.club}
                              className={style}
                            >
                              <label className="flex items-center">
                                <input
                                  name="checkbox"
                                  type="checkbox"
                                  value={membership.club}
                                  onChange={handleFilterChange}
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
                                  {matchedStatistics.memberships.find(
                                    (i) => i.club === membership.club
                                  )?.count || 0}
                                </span>
                                {membership.club}
                              </label>
                            </span>
                          );
                        })}

                        <div className="flex pt-4 justify-center">
                          <label className="mr-2 mt-2">Filter by:</label>
                          <select
                            onChange={handleFilterChange}
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

                  return (
                    <div
                      key={"user_" + user.id}
                      className="border border-gray-300 p-4 rounded-lg shadow-sm bg-neutral-100 w-full h-full flex flex-col"
                    >
                      <h3 className="text-md font-semibold text-black">
                        {user.username}
                      </h3>

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
                      <button
                        className="mt-2 inline-flex justify-center items-center gap-1 rounded-md border border-gray-300 bg-green-900 px-2 py-1 text-[0.7rem] font-medium text-white shadow-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-gray-100"
                      >
                        Message {user.username}
                      </button>
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
      </div>
    </>
  );
}
