"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header/Header.jsx";

const SUPERUSER_EMAIL = "hivequeen.omega@hivefinder.local"; // your seeded superuser

export default function ClubAdminPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [error, setError] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const controller = new AbortController();

    const init = async () => {
      try {
        // LOGIN CHECK: same as "user" in localStorage
        const rawUser = localStorage.getItem("user");

        if (!rawUser) {
          router.replace("/login");
          return;
        }

        let user;
        try {
          user = JSON.parse(rawUser);
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
          router.replace("/login");
          return;
        }

        // SUPERUSER CHECK (role if present, else email)
        const isSuperuser =
          user?.role === "SUPERUSER" || user?.email === SUPERUSER_EMAIL;

        if (!isSuperuser) {
          router.replace("/");
          return;
        }

        setCheckingAuth(false);
        setLoadingClubs(true);
        setError(null);

        //REAL BACKEND CLUBS
        const res = await fetch("/api/clubs", {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to fetch clubs (status ${res.status})`);
        }

        const data = await res.json();
        setClubs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error in ClubAdminPage:", err);
        setError(err.message || "Failed to load clubs");
      } finally {
        setLoadingClubs(false);
      }
    };

    init();

    return () => controller.abort();
  }, [router]);

  // 🔨 Delete handler that calls DELETE /api/clubs/[id]
  const handleDeleteClub = async (club) => {
    const sure = window.confirm(
      `Delete club "${club.name}"?\n\nThis will permanently remove it once confirmed.`
    );
    if (!sure) return;

    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Missing auth token. Please log in again.");
      return;
    }

    try {
      setDeletingId(club.id);

      const res = await fetch(`/api/clubs/${club.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        alert("Your admin session expired or you are not a superuser.");
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to delete club (status ${res.status})`);
      }

      // ✅ Remove from local state so UI updates immediately
      setClubs((prev) => prev.filter((c) => c.id !== club.id));
    } catch (err) {
      console.error("Error deleting club:", err);
      alert(`Error deleting club: ${err.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (checkingAuth) {
    // No flash while deciding auth/redirect
    return null;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Club Admin Dashboard
              </h1>
              <p className="mt-1 text-xs text-gray-500">
                View and manage all clubs from the live database. Only visible
                to the SUPERUSER account.
              </p>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
              SUPERUSER ONLY
            </span>
          </div>

          {/* Loading / error states */}
          {loadingClubs && (
            <p className="mb-4 text-xs text-gray-500">Loading clubs…</p>
          )}
          {error && (
            <p className="mb-4 text-xs text-red-600">
              Error loading clubs: {error}
            </p>
          )}

          {/* Clubs table */}
          {!loadingClubs && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Categories</th>
                    <th className="px-3 py-2">Fields of Study</th>
                    <th className="px-3 py-2 text-center">Points</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clubs.map((club) => (
                    <tr key={club.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 align-top">
                        <div className="text-xs font-medium text-gray-900">
                          {club.name}
                        </div>
                        {club.clubUrl && (
                          <a
                            href={club.clubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-block text-[10px] text-blue-600 underline"
                          >
                            Visit club page
                          </a>
                        )}
                      </td>

                      <td className="max-w-md px-3 py-2 align-top">
                        <p className="line-clamp-3 text-[11px] text-gray-700">
                          {club.description || "No description"}
                        </p>
                      </td>

                      <td className="px-3 py-2 align-top text-[10px]">
                        {Array.isArray(club.categories) &&
                        club.categories.length
                          ? club.categories.map((c) => (
                              <span
                                key={c}
                                className="mr-1 mb-1 inline-block rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] text-white"
                              >
                                {c}
                              </span>
                            ))
                          : "—"}
                      </td>

                      <td className="px-3 py-2 align-top text-[10px]">
                        {Array.isArray(club.fieldsOfStudy) &&
                        club.fieldsOfStudy.length
                          ? club.fieldsOfStudy.map((f) => (
                              <span
                                key={f}
                                className="mr-1 mb-1 inline-block rounded-full bg-neutral-300 px-2 py-0.5 text-[9px] text-black"
                              >
                                {f}
                              </span>
                            ))
                          : "—"}
                      </td>

                      <td className="px-3 py-2 text-center align-top text-[11px]">
                        {typeof club.points === "number" ? club.points : "—"}
                      </td>

                      <td className="px-3 py-2 text-right align-top">
                        <div className="inline-flex items-center gap-2">
                          {/* Quarantine still a stub */}
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Quarantine requested for "${club.name}".\n\nThis is just a stub for now.`
                              )
                            }
                            className="rounded-full bg-yellow-100 px-3 py-1 text-[10px] font-medium text-yellow-800 hover:bg-yellow-200"
                          >
                            Quarantine
                          </button>

                          {/* REAL DELETE */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClub(club)}
                            disabled={deletingId === club.id}
                            className={`rounded-full px-3 py-1 text-[10px] font-medium text-red-800 hover:bg-red-200 ${
                              deletingId === club.id
                                ? "bg-red-100 opacity-60 cursor-wait"
                                : "bg-red-100"
                            }`}
                          >
                            {deletingId === club.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {clubs.length === 0 && !error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-xs text-gray-500"
                      >
                        No clubs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
