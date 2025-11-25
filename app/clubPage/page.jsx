"use client";

import React, { useMemo, useState } from "react";
import Header from "../components/header/Header";
import clubs_enriched from '../../utilities/clubs.json';

// Reuse styling patterns from interests/membership page.jsx
const sharedStyle =
  "text-xxs m-[2px] px-1 py-1 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 inline-block";
const normalStyle =
  "text-xxs m-[2px] px-1 py-1 bg-neutral-300 text-black rounded-md hover:bg-neutral-200 inline-block";
const counterStyle =
  "mx-1 inline-flex items-center justify-center w-3 h-3 p-2 text-xxxs font-semibold text-neutral-800 bg-[#f4c201] rounded-full position-relative top-0 left-0";
const starStyle =
  "w-3 h-3 mx-0 shrink-0 text-yellow-400 transition peer-checked:scale-130 peer-checked:rotate-360 peer-checked:fill-yellow-400 peer-checked:stroke-yellow-400 fill-transparent stroke-gray-300 stroke-[3] cursor-pointer";

export default function BrowseClubs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [sortBy, setSortBy] = useState("points_desc"); // points_desc | name_asc | name_desc

  // Build unique categories + counts
  const categoryStats = useMemo(() => {
    const map = new Map();
    clubs_enriched.forEach((club) => {
      (club.categories || []).forEach((cat) => {
        map.set(cat, (map.get(cat) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Build unique fieldsOfStudy + counts
  const fieldStats = useMemo(() => {
    const map = new Map();
    clubs_enriched.forEach((club) => {
      (club.fieldsOfStudy || []).forEach((field) => {
        map.set(field, (map.get(field) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Toggle helpers
  const toggleCategory = (value) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const toggleField = (value) => {
    setSelectedFields((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  // Derived filtered + sorted clubs
  const filteredClubs = useMemo(() => {
    let result = [...clubs_enriched];

    // Search filter
    if (searchTerm.trim() !== "") {
      const t = searchTerm.toLowerCase();
      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(t) ||
          (club.description || "").toLowerCase().includes(t)
      );
    }

    // Category filter (OR semantics)
    if (selectedCategories.length > 0) {
      result = result.filter((club) =>
        (club.categories || []).some((cat) => selectedCategories.includes(cat))
      );
    }

    // Field of study filter (OR semantics)
    if (selectedFields.length > 0) {
      result = result.filter((club) =>
        (club.fieldsOfStudy || []).some((field) =>
          selectedFields.includes(field)
        )
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      // points_desc (default): nulls to bottom
      const pa = typeof a.points === "number" ? a.points : -Infinity;
      const pb = typeof b.points === "number" ? b.points : -Infinity;
      if (pb !== pa) return pb - pa;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [searchTerm, selectedCategories, selectedFields, sortBy]);

  const content = (
    <div className="w-full flex justify-center p-3">
      <div className="w-full max-w-5xl text-center">
        {/* Title */}
        <h1 className="text-lg py-3 font-semibold text-black uppercase">
          Browse Clubs
        </h1>

        {/* Filter + sort panel styled like interests page */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Search + sort */}
          <div className="border border-gray-300 p-4 rounded-lg shadow-sm bg-neutral-100">
            <h2 className="text-sm font-semibold text-black mb-2">
              Search & Sort
            </h2>
            <div className="mb-3 text-left">
              <label className="block text-xxs font-medium text-gray-600 mb-1">
                Search clubs
              </label>
              <input
                type="text"
                name="search"
                placeholder="Search by club name or description..."
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-left">
              <label className="block text-xxs font-medium text-gray-600 mb-1">
                Sort by
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2 text-xs text-black"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="points_desc">Points (high → low)</option>
              </select>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Showing <b>{filteredClubs.length}</b> clubs
            </p>
          </div>

          {/* Category + field filters in chip style with stars + counters */}
          <div className="border border-gray-300 p-4 rounded-lg shadow-sm bg-neutral-100">
            <h2 className="text-sm font-semibold text-black mb-2">
              Filter by Category
            </h2>
            <div className="flex flex-wrap justify-center">
              {categoryStats.map(({ name, count }) => {
                const isSelected = selectedCategories.includes(name);
                const style = isSelected ? sharedStyle : sharedStyle;
                return (
                  <span key={name} className={style}>
                    <label className="flex items-center">
                      <input
                        name="category"
                        type="checkbox"
                        value={name}
                        onChange={() => toggleCategory(name)}
                        checked={isSelected}
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
                      {name}
                    </label>
                  </span>
                );
              })}
            </div>

            {fieldStats.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-black mt-4 mb-2">
                  Filter by Field of Study
                </h2>
                <div className="flex flex-wrap justify-center">
                  {fieldStats.map(({ name, count }) => {
                    const isSelected = selectedFields.includes(name);
                    const style = isSelected ? sharedStyle : sharedStyle;
                    return (
                      <span key={name} className={style}>
                        <label className="flex items-center">
                          <input
                            name="field"
                            type="checkbox"
                            value={name}
                            onChange={() => toggleField(name)}
                            checked={isSelected}
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
                          {name}
                        </label>
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Accordion list of clubs (toggle visibility) */}
        <div id="accordion-collapse" className="w-full" data-accordion="collapse">
          {filteredClubs.map((club, index) => (
            <div key={club.id ?? index} className="mb-4">
              <h3 id={`accordion-collapse-heading-${index}`}>
                <button
                  type="button"
                  className="flex items-center w-full justify-between p-5 mt-2 font-medium text-gray-900 border border-b-0 border-gray-500 rounded-t-xl hover:bg-gray-100 gap-3 bg-white"
                  data-accordion-target={`#accordion-collapse-body-${index}`}
                  aria-expanded="false"
                  aria-controls={`accordion-collapse-body-${index}`}
                >
                  <span className="text-center">
                    <span className="block text-sm font-semibold">
                      {club.name}
                    </span>
                    {typeof club.points === "number" && (
                      <span className="text-xxs text-gray-500">
                        Points: <b>{club.points}</b>
                      </span>
                    )}
                  </span>
                </button>
              </h3>
              <div
                id={`accordion-collapse-body-${index}`}
                aria-labelledby={`accordion-collapse-heading-${index}`}
              >
                <div className="p-5 border border-gray-200 bg-neutral-900/90 rounded-b-xl text-left">
                  {/* Categories & fields */}
                  <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-300 mb-1">Fields of Study:</p>
                    {(club.fieldsOfStudy || []).map((field) => (
                      <span
                        key={field}
                        className="inline-block px-2 py-1 my-1 mr-1 text-xxs font-semibold text-gray-800 bg-[#f4c201] rounded-full"
                      >
                        {field}
                      </span>
                    ))}
                    <br/>
                    <p className="text-xs font-semibold text-gray-300 mb-1">Categories:</p>
                    {(club.categories || []).map((category) => (
                      <span
                        key={category}
                        className="inline-block px-2 py-1 my-1 mr-1 text-xxs font-semibold text-gray-800 bg-gray-200 rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  <hr className="my-3 border-gray-700" />
                  {/* description */}
                  <p className="text-xs text-gray-100 mb-3">
                    {club.description || "No description available."}
                  </p>
                  {/* Link */}
                  {club.clubUrl && (
                    <a
                      href={club.clubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-medium text-blue-300 hover:text-blue-200 underline"
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
  );

  return (
    <>
      <Header />
      {content}
    </>
  );
}
