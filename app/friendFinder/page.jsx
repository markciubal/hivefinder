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

    const sharedStyle = "text-xs m-1 px-4 py-2 bg-green-900 text-white rounded-full hover:bg-green-800! inline-block";
    const normalStyle = "text-xs m-1 px-4 py-2 bg-gray-200 text-black rounded-full hover:bg-gray-100 inline-block";

    const handleFilterChange = (event) => {
      const { name, value } = event.target;
      const selectedSimilarities = document.querySelectorAll('input[name="checkbox"]:checked');
      const selectedSimilaritiesArray = Array.from(selectedSimilarities).map(input => input.value);
      console.log("Selected similarities:", selectedSimilaritiesArray);
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
            { club: "National Association for Music Education Collegiate" },
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
        <div className="hero-form">
          <div className="text-content-title">
            <p className="text-2 font-bold">Find Your Hive</p>
            <p className="text-9">What are your interests?</p>
          </div>

          <div className="form-contact">
                <div className="w-full text-center">
                <h2>Your Data</h2>
                {userSelf?.interests && matchedStatistics && (
                  <div key={"interests_" + userSelf.id} className="border-b border-gray-300 p-4">
                    <h3 className="text-md font-semibold text-black">{userSelf.username}</h3>
                    <h4 className="text-sm text-gray-600">Interests</h4>
                    <label className="block text-center font-medium text-gray-700 mb-2">Filter by shared interests and clubs:</label>
                    <div className="flex justify-center">
                      <select onChange={handleFilterChange} id="andor" name="andor" className="border justify-center text-black border-gray-300 rounded-md p-2 mb-4 w-25">
                        <option value="and">AND</option>
                        <option value="or">OR</option>
                      </select>
                    </div>
                    {userSelf.interests.map((interest, index) => {
                      const isShared = matchedStatistics.interests.some(i => i.name === interest);
                      const style = isShared ? sharedStyle : normalStyle;
                      const count = matchedStatistics.interests.find(i => i.name === interest)?.count || 0;

                      return (
                        <span key={index} className={style}>
                          <input
                            name="checkbox"
                            type="checkbox"
                            value={interest}
                            onChange={handleFilterChange}
                            className="form-checkbox h-2 w-2 mx-1 shrink-0 rounded border-gray-300 text-blue-600"
                          />
                          <span className="mx-1 inline-flex items-center justify-center w-6 h-6 p-2 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
                            {count}
                          </span>
                          {interest}
                        </span>
                      );
                    })}
                  </div>
                )}
                {userSelf?.memberships && (
                  <div key={"clubs_" + userSelf.id} className="border-b border-gray-300 p-1">  
                    <h4>Memberships</h4>
                    {userSelf.memberships.map((membership, index) => {
                      console.log(matchedStatistics);
                      const isShared = userSelf.memberships?.some(sc => sc.club === membership.club);
                      const style = isShared ? sharedStyle : normalStyle;
                      return (
                        <span key={"user_" + userSelf.id + "_" + membership.club} className={style}>
                          <input
                            name="checkbox"
                            type="checkbox"
                            value={membership.club}
                            onChange={handleFilterChange}
                            className="form-checkbox h-2 w-2 mx-1 shrink-0 rounded border-gray-300 text-blue-600"
                          />
                          <span className="mx-1 inline-flex items-center justify-center w-6 h-6 p-2 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
                            {matchedStatistics.memberships.find(i => i.club === membership.club)?.count || 0}
                          </span>
                          {membership.club}
                        </span>
                      );
                    })}
                  </div>
                )}
                <h2 className="text-black">Find friends who share your interests!</h2>
                <h3 className="text-black">We found {filteredFriends.length} friends:</h3>
                {organizedFriends && filteredFriends.map((user) => {
                return (
                      <div key={"user_" + user.id} className="border-b border-gray-300 p-4">
                          <h3 className="text-md font-semibold text-black">{user.username}</h3>
                          <h4 className="text-sm text-gray-600">Interests</h4>
                          {user.interests.map((interest, index) => {
                              if (user.sharedInterests.includes(interest)) {
                                var style = sharedStyle;
                            } else {
                                var style = normalStyle;
                            }
                          return (
                            <span key={index} className={style}>
                              {interest}
                            </span>
                        )})}
                        <h4>Memberships</h4>
                        {user.memberships.map((membership, index) => {
                              if (user.sharedClubs?.includes(membership)) {
                                var style = sharedStyle;
                            } else {
                                var style = normalStyle;
                            }
                          return (
                            <span key={index} className={style}>
                              {membership.club}
                            </span>
                        )})}

                    </div>
                  )})
                }
            </div>
          </div>
        </div>
      </>
    );
  }
