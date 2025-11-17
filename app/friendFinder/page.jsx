  'use client'
  import React, { useEffect, useState } from 'react';
  import Header from "../components/header/Header.jsx";
  import interests from '../../utilities/interests.json';
  import users_500 from '../../utilities/users_500.json';
    
  function getRandomInterests(interests, count) {
    // Copy the array to avoid mutating the original.
    const shuffled = [...interests].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).sort();
  }
  export default function Page() {
    const [userSelf, setUserSelf] = useState({});
    const [organizedFriends, setOrganizedFriends] = useState([]);
    const [filteredFriends, setFilteredFriends] = useState([]);
    const [clubFriends, setClubFriends] = useState([]);
    const [matchedStatistics, setMatchedStatistics] = useState({ interests: [], memberships: [] });
    // inside your component:
    const [otherInterestsModal, setOtherInterestsModal] = useState(null);
    const [otherMembershipsModal, setOtherMembershipsModal] = useState(null);
    // null or { username, interests }

    const sharedStyle = "text-xxs m-[2px] px-1 py-1 bg-neutral-900 text-white rounded-md hover:bg-neutral-700! inline-block";
    const normalStyle = "text-xxs m-[2px] px-1 py-1 bg-neutral-300 text-black rounded-md hover:bg-neutral-200 inline-block";
    
    const counterStyle = "mx-1 inline-flex items-center justify-center w-3 h-3 p-2 text-xxxs font-semibold text-neutral-800 bg-[#f4c201] rounded-full position-relative top-0 left-0";
    const starStyle = "w-3 h-3 mx-0 shrink-0 text-yellow-400 transition peer-checked:scale-130 peer-checked:rotate-360 peer-checked:fill-yellow-400 peer-checked:stroke-yellow-400 fill-transparent stroke-gray-300 stroke-[3] cursor-pointer";
    const handleFilterChange = (event) => {
      const { name, value } = event.target;
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
    useEffect(() => {
        const randomInterests = getRandomInterests(interests, 10);

        setUserSelf({
            id: 501,
            username: "demoUser",
            interests: randomInterests,
            memberships: [
            { club: "Men's Soccer Club" },
            { club: "The Belonging Collective" },
            ]
        });
    }, []);

    useEffect(() => {
        if (!userSelf?.interests) return;

        const matchedStats = { interests: [], memberships: [] };

        const matches = users_500
          .filter(user => user.id !== 501)
          .map((user) => {
            const matchedInterests = user.interests.filter((i) =>
              userSelf.interests.includes(i)
            );
            const matchedClubs = user.memberships.filter((club) =>
              userSelf.memberships.some((c) => c.club === club.club)
            );

            // update interest counts
            // in useEffect when building matchedStats
            matchedInterests.forEach((name) => {
              const node = matchedStats.interests.find((x) => x.name === name);
              if (node) node.count += 1;
              else matchedStats.interests.push({ name, count: 1 });
            });


            // update club counts
            matchedClubs.forEach(({ id, club }) => {
              const node = matchedStats.memberships.find((x) => x.club === club);
              if (node) node.count += 1;
              else matchedStats.memberships.push({ id, club, count: 1 });
            });
            setMatchedStatistics(matchedStats);
            return { ...user, matchedInterests, matchedClubs };
          })
          .filter((u) => u.matchedInterests.length > 0 || u.matchedClubs.length > 0);

        setClubFriends(matches);
        console.log(matches);
        console.log(userSelf);
          const organized = matches.map((user) => {
          const sharedInterests = user.interests.filter((interest) =>
            userSelf.interests.includes(interest)
          );
          const sharedClubs = user.memberships.filter((club) =>
            userSelf.memberships.map(c => c.club).includes(club.club)
          );
          return { ...user, sharedInterests, sharedClubs };
        }).sort((a, b) => (b.sharedInterests.length + b.sharedClubs.length) - (a.sharedInterests.length + a.sharedClubs.length));
        setOrganizedFriends(organized);
        setFilteredFriends(organized);
    }, [userSelf]);
    return (
      <>
        <Header />
        <div className="">
          <div className=" text-center">
          <p className="text-2 font-bold">Find Your Hive</p>
            {/* Card grid: self + matches */}
            <div className="w-full flex justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl justify-center">
                <div className="text-center col-span-full">
                  {userSelf?.interests && matchedStatistics && (
                    <div
                      key={"interests_" + userSelf.id}
                      className="col-span-full border-b border-gray-300 p-4 rounded-lg shadow-sm bg-white text-center"
                    >
                      <h3 className="text-lg font-semibold text-black">{userSelf.username}</h3>
                      <h4 className="text-black">Filter by Common Interests</h4>

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
                              {/* Star icon */}
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
                          <h4>Filter by Common Memberships</h4>
                          {userSelf.memberships.map((membership, index) => {
                            console.log(matchedStatistics);
                            const isShared = userSelf.memberships?.some(
                              (sc) => sc.club === membership.club
                            );
                            const style = isShared ? sharedStyle : normalStyle;
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

                                  {/* Star icon */}
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
                    const matchedInterests = user.interests.filter((interest) =>
                      user.sharedInterests?.includes(interest)
                    );
                    const otherInterests = user.interests.filter(
                      (interest) => !user.sharedInterests?.includes(interest)
                    );

                    const matchedMemberships = user.memberships.filter((membership) =>
                      user.sharedClubs?.includes(membership)
                    );
                    const otherMemberships = user.memberships.filter(
                      (membership) => !user.sharedClubs?.includes(membership)
                    );

                    console.log(user);
                    console.log(otherMemberships);

                    return (
                      <div
                        key={"user_" + user.id}
                        className="border border-gray-300 p-4 rounded-lg shadow-sm bg-white w-full h-full flex flex-col"
                      >
                        <h3 className="text-md font-semibold text-black">
                          {user.username}
                        </h3>

                        {/* Interests */}
                        <h4 className="text-sm text-gray-600">Interests</h4>

                        {/* Only matched interests inline */}
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

                        {/* Button to open modal for remaining interests */}
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

                        {/* Only matched memberships inline */}
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

                        {/* Button to open modal for remaining memberships */}
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
          {otherInterestsModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="max-w-md w-full mx-4 rounded-lg bg-white shadow-xl">
                      {/* Header */}
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

                      {/* Body */}
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

                      {/* Footer */}
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
                      {/* Header */}
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

                      {/* Body */}
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

                      {/* Footer */}
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
