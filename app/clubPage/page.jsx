"use client";

import React, { useMemo, useState, useEffect } from "react";
import Header from "../components/header/Header";

const sharedStyle =
  "text-xxs m-[2px] px-1 py-1 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 inline-block";
const counterStyle =
  "mx-1 inline-flex items-center justify-center w-3 h-3 p-2 text-xxxs font-semibold text-neutral-800 bg-[#f4c201] rounded-full";
const starStyle =
  "w-3 h-3 mx-0 shrink-0 text-yellow-400 transition peer-checked:scale-130 peer-checked:rotate-360 peer-checked:fill-yellow-400 peer-checked:stroke-yellow-400 fill-transparent stroke-gray-300 stroke-[3] cursor-pointer";

//
// JOIN / LEAVE BUTTON
//
function JoinLeaveButton({ clubId }) {
  const [isMember, setIsMember] = useState(null);

  async function loadStatus() {
    const token = localStorage.getItem("token");
    if (!token) return setIsMember(false);

    const res = await fetch(`/api/clubs/status?clubId=${clubId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setIsMember(data.member);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function toggle() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const route = isMember ? "leave" : "join";

    const res = await fetch(`/api/clubs/${route}?clubId=${clubId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (data.joined || data.left) loadStatus();
  }

  if (isMember === null) {
    return (
      <p className="text-xs text-gray-400 mt-2">Loading membership...</p>
    );
  }

  return (
    <button
      onClick={toggle}
      className="mt-3 px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
    >
      {isMember ? "Leave club" : "Join club"}
    </button>
  );
}

//
// MAIN PAGE
//
export default function BrowseClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [sortBy, setSortBy] = useState("points_desc");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/clubs/list");
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setClubs(data);
      } catch {
        setLoadError("Could not load clubs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categoryStats = useMemo(() => {
    const map = new Map();
    clubs.forEach((club) => {
      (club.categories || []).forEach((cat) => {
        map.set(cat, (map.get(cat) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clubs]);

  const fieldStats = useMemo(() => {
    const map = new Map();
    clubs.forEach((club) => {
      (club.fieldsOfStudy || []).forEach((field) => {
        map.set(field, (map.get(field) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clubs]);

  function toggleCategory(value) {
    setSelectedCategories((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  function toggleField(value) {
    setSelectedFields((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  const filteredClubs = useMemo(() => {
    let result = [...clubs];

    if (searchTerm.trim() !== "") {
      const t = searchTerm.toLowerCase();
      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(t) ||
          (club.description || "").toLowerCase().includes(t)
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((club) =>
        (club.categories || []).some((c) => selectedCategories.includes(c))
      );
    }

    if (selectedFields.length > 0) {
      result = result.filter((club) =>
        (club.fieldsOfStudy || []).some((f) => selectedFields.includes(f))
      );
    }

    result.sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);

      const pa =
        typeof a.points === "number" ? a.points : -Infinity;
      const pb =
        typeof b.points === "number" ? b.points : -Infinity;

      return pb - pa || a.name.localeCompare(b.name);
    });

    return result;
  }, [clubs, searchTerm, selectedCategories, selectedFields, sortBy]);

  return (
    <>
      <Header />
      <div className="w-full flex justify-center p-3">
        <div className="w-full max-w-5xl text-center">
          <h1 className="text-lg py-3 font-semibold text-black uppercase">
            Browse Clubs
          </h1>

          {loading && (
            <p className="text-xs text-gray-500">Loading clubs...</p>
          )}
          {loadError && (
            <p className="text-xs text-red-600">{loadError}</p>
          )}

          <div id="accordion-collapse" className="w-full">
            {filteredClubs.map((club, index) => (
              <div key={club.id ?? index} className="mb-4">
                <h3 id={`accordion-heading-${index}`}>
                  <button
                    type="button"
                    className="flex items-center w-full justify-between p-5 mt-2 font-medium text-gray-900 border border-b-0 border-gray-500 rounded-t-xl hover:bg-gray-100 gap-3 bg-white"
                    data-accordion-target={`#accordion-body-${index}`}
                  >
                    <span className="text-center">
                      <span className="block text-sm font-semibold">
                        {club.name}
                      </span>
                      <span className="text-xxs text-gray-500">
                        Points: <b>{club.points}</b>
                      </span>
                    </span>
                  </button>
                </h3>

                <div id={`accordion-body-${index}`}>
                  <div className="p-5 border border-gray-200 bg-neutral-900/90 rounded-b-xl text-left">

                    <p className="text-xs text-gray-100 mb-3">
                      {club.description || "No description available."}
                    </p>

                    {/* JOIN BUTTON */}
                    <JoinLeaveButton clubId={club.id} />

                    {club.clubUrl && (
                      <a
                        href={club.clubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-medium text-blue-300 hover:text-blue-200 underline mt-3 block"
                      >
                        Visit club page
                      </a>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
