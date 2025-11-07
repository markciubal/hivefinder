"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Clubs
  const [clubSearch, setClubSearch] = useState("");
  const [selectedClub, setSelectedClub] = useState("");
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);
  const clubRef = useRef(null);

  // Interests
  const interestOptions = ["Music", "Coding", "Chess", "Art", "Sports"];
  const [interests, setInterests] = useState([]);
  const [interestDropdownOpen, setInterestDropdownOpen] = useState(false);
  const interestRef = useRef(null);

  const clubs = ["Chess Club", "Coding Club", "Book Club", "Music Club"];
  const filteredClubs = clubs.filter((club) =>
    club.toLowerCase().includes(clubSearch.toLowerCase())
  );
  const filteredInterests = interestOptions.filter(
    (i) => !interests.includes(i)
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clubRef.current && !clubRef.current.contains(e.target)) {
        setClubDropdownOpen(false);
      }
      if (interestRef.current && !interestRef.current.contains(e.target)) {
        setInterestDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password, selectedClub, interests });
    alert("Check console for current signup data!");
  };

  const addInterest = (interest) => {
    setInterests([...interests, interest]);
  };

  const removeInterest = (interest) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  return (
    <div className="page-container">
      <Header /> {/* ✅ Render the universal header */}

      <div className="container">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h1>Sign Up</h1>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {/* Club Dropdown */}
          <label ref={clubRef}>
            Join a Club
            <input
              type="text"
              placeholder="Search clubs..."
              value={clubSearch}
              onChange={(e) => {
                setClubSearch(e.target.value);
                setClubDropdownOpen(true);
              }}
              onFocus={() => setClubDropdownOpen(true)}
            />
            {clubDropdownOpen && filteredClubs.length > 0 && (
              <div className="dropdown">
                {filteredClubs.map((club) => (
                  <div
                    key={club}
                    className="dropdown-item"
                    onClick={() => {
                      setSelectedClub(club);
                      setClubSearch(club);
                      setClubDropdownOpen(false);
                    }}
                  >
                    {club}
                  </div>
                ))}
              </div>
            )}
          </label>
          {selectedClub && <p>Selected club: {selectedClub}</p>}

          {/* Interests Dropdown */}
          <label ref={interestRef}>
            Interests
            <div
              className="interest-dropdown-input"
              onClick={() => setInterestDropdownOpen(true)}
            >
              <span className="placeholder">Select interests...</span>
            </div>
            {interestDropdownOpen && filteredInterests.length > 0 && (
              <div className="dropdown">
                {filteredInterests.map((interest) => (
                  <div
                    key={interest}
                    className="dropdown-item"
                    onClick={() => addInterest(interest)}
                  >
                    {interest}
                  </div>
                ))}
              </div>
            )}
            <div className="tags">
              {interests.map((interest) => (
                <div className="tag" key={interest}>
                  {interest} <span onClick={() => removeInterest(interest)}>x</span>
                </div>
              ))}
            </div>
          </label>

          <button type="submit">Sign Up</button>
        </form>
      </div>

      <style jsx>{`
        .page-container {
          display: flex;
          flex-direction: column;
        }
        .container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          background-color: white;
          padding-top: 50px;
        }
        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 40px;
          border: 1px solid black;
          border-radius: 8px;
          width: 350px;
        }
        h1 {
          text-align: center;
          font-size: 24px;
        }
        label {
          display: flex;
          flex-direction: column;
          font-size: 14px;
          position: relative;
        }
        input {
          margin-top: 5px;
          padding: 8px;
          border: 1px solid black;
          border-radius: 4px;
        }
        button {
          padding: 10px;
          background-color: black;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        button:hover {
          background-color: #333;
        }

        /* Dropdowns now part of the flow */
        .dropdown {
          border: 1px solid black;
          max-height: 150px;
          overflow-y: auto;
          margin-top: 5px;
          background: white;
        }
        .dropdown-item {
          padding: 5px;
          cursor: pointer;
        }
        .dropdown-item:hover {
          background-color: #f0f0f0;
        }

        /* Interests tags */
        .interest-dropdown-input {
          padding: 8px;
          border: 1px solid black;
          border-radius: 4px;
          cursor: pointer;
          min-height: 40px;
        }
        .interest-dropdown-input .placeholder {
          color: #888;
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 5px;
        }
        .tag {
          background: black;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
        }
        .tag span {
          cursor: pointer;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

export default SignupPage;
