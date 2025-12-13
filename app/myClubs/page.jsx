"use client";

import { useEffect, useState } from "react";
import Header from "../components/header/Header";

export default function MyClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem("token");
    if (!token) {
      setClubs([]);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/user/myClubs", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    setClubs(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Header />

      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-lg font-semibold mb-4">My Clubs</h1>

        {loading && <p className="text-sm text-gray-600">Loading...</p>}

        {!loading && clubs.length === 0 && (
          <p className="text-sm text-gray-600">
            You have not joined any clubs yet.
          </p>
        )}

        {clubs.map((entry) => (
          <div
            key={entry.id}
            className="border p-3 rounded mb-3 bg-white shadow-sm"
          >
            <p className="font-semibold">{entry.club.name}</p>
            <p className="text-xs text-gray-600 mb-2">{entry.club.description}</p>

            <a
              href={`/clubPage`}
              className="text-xs text-blue-600 hover:text-blue-400 underline"
            >
              View club page
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
