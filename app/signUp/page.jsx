"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';

function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [loading, setLoading] = useState(false);

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
      if (clubRef.current && !clubRef.current.contains(e.target)) setClubDropdownOpen(false);
      if (interestRef.current && !interestRef.current.contains(e.target)) setInterestDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // CSUS email validation
  useEffect(() => {
    if (!email) setEmailError(null);
    else if (!email.endsWith("@csus.edu")) setEmailError("Only CSUS email accounts allowed");
    else setEmailError(null);
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError) return;
    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, selectedClub, interests }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Account created successfully!");
        window.location.href = "/login";
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const addInterest = (interest) => setInterests([...interests, interest]);
  const removeInterest = (interest) => setInterests(interests.filter((i) => i !== interest));

  return (
    <div className="page-container">
      <Header />

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
          {emailError && <p className="error-text">{emailError}</p>}

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
              onChange={(e) => { setClubSearch(e.target.value); setClubDropdownOpen(true); }}
              onFocus={() => setClubDropdownOpen(true)}
            />
            {clubDropdownOpen && filteredClubs.length > 0 && (
              <div className="dropdown">
                {filteredClubs.map((club) => (
                  <div
                    key={club}
                    className="dropdown-item"
                    onClick={() => { setSelectedClub(club); setClubSearch(club); setClubDropdownOpen(false); }}
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
            <div className="interest-dropdown-input" onClick={() => setInterestDropdownOpen(true)}>
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

          <button type="submit" disabled={!!emailError || loading}>
            {loading ? "Signing up…" : "Sign Up"}
          </button>
        </form>
      </div>

      <Footer />

      <style jsx>{`
        .page-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 16px;
          background-color: #f9f9f9;
        }
        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 8px;
          width: 380px;
          background: #fff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        h1 {
          text-align: center;
          font-size: 26px;
          margin-bottom: 10px;
        }
        label {
          display: flex;
          flex-direction: column;
          font-size: 14px;
        }
        input {
          margin-top: 6px;
          padding: 10px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          outline: none;
        }
        .error-text {
          color: crimson;
          margin-top: 4px;
          font-size: 12px;
        }
        button {
          padding: 12px;
          background-color: #0b5a21;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }
        button:disabled {
          background-color: #aaa;
          cursor: not-allowed;
        }
        .dropdown {
          border: 1px solid #ccc;
          background: #fff;
          max-height: 150px;
          overflow-y: auto;
          margin-top: 4px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .dropdown-item {
          padding: 6px 10px;
          cursor: pointer;
        }
        .dropdown-item:hover {
          background-color: #f0f0f0;
        }
        .interest-dropdown-input {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
          cursor: pointer;
          min-height: 40px;
          display: flex;
          align-items: center;
        }
        .interest-dropdown-input .placeholder {
          color: #888;
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }
        .tag {
          background: #0b5a21;
          color: #fff;
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
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
