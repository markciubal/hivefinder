"use client";

import { useState } from "react";
import Header from "../components/header/Header";
import { useRouter } from "next/navigation";

export default function CreateClub() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState("");
  const [fields, setFields] = useState("");
  const [points, setPoints] = useState("");
  const [clubUrl, setClubUrl] = useState("");

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function submitClub(e) {
    e.preventDefault();
    setError("");
    setMsg("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Log in first to create a club.");
      return;
    }

    const res = await fetch("/api/clubs/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        description,
        categories: categories.split(",").map((x) => x.trim()),
        fieldsOfStudy: fields.split(",").map((x) => x.trim()),
        points,
        clubUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Unable to create club");
      return;
    }

    setMsg("Club created!");

    setTimeout(() => {
      router.push("/clubPage");
    }, 900);
  }

  return (
    <>
      <Header />

      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <h1 className="text-xl font-bold text-black mb-5">Create a New Club</h1>

        <form onSubmit={submitClub} className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-black mb-1">Club Name</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chess Club"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your club does..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1">
              Categories (comma separated)
            </label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="Sports, Arts, Technology"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1">
              Fields of Study (comma separated)
            </label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              value={fields}
              onChange={(e) => setFields(e.target.value)}
              placeholder="Computer Science, Business..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1">
              Points (optional)
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1">
              Club Website (optional)
            </label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              value={clubUrl}
              onChange={(e) => setClubUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {msg && <p className="text-green-600 text-sm">{msg}</p>}

          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded-lg font-semibold hover:bg-green-600"
          >
            Create Club
          </button>
        </form>
      </div>
    </>
  );
}
