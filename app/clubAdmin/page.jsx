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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const controller = new AbortController();

    const init = async () => {
      try {
        // ✅ LOGIN CHECK: same as Header → just "user"
        const rawUser = localStorage.getItem("user");

        // Not logged in → go to login
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

        // ✅ SUPERUSER CHECK:
        // Prefer user.role if you've wired it, otherwise fall back to email
        const isSuperuser =
          user?.role === "SUPERUSER" || user?.email === SUPERUSER_EMAIL;

        // Logged in but not superuser → send them home
        if (!isSuperuser) {
          router.replace("/");
          return;
        }

        setCheckingAuth(false);
        setLoadingClubs(true);
        setError(null);

        // ✅ REAL BACKEND DATA: use your existing /api/clubs endpoint
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

  // While deciding auth / redirecting, render nothing so it doesn't flash
  if (checkingAuth) {
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

          {/* Create club placeholder */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h2 className="mb-1 text-sm font-semibold text-gray-800">
              Create new club
            </h2>
            <p className="mb-3 text-xs text-gray-600">
              Club creation form coming soon. For now this is just a disabled
              placeholder.
            </p>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md bg-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              + Create club
            </button>
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
                      <td className="px-3 py-2.align-top">
                        <div className="text-xs font-medium text-gray-900">
                          {club.name}
                        </div>
                        {club.clubUrl && (
                          <a
                            href={club.clubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5.inline-block text-[10px] text-blue-600 underline"
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
                          <button
                            type="button"
                            onClick={() => {
                              const sure = window.confirm(
                                `Delete club "${club.name}"?\n\nOnce wired to a delete API, this will be permanent.`
                              );
                              if (!sure) return;
                              setClubs((prev) =>
                                prev.filter((c) => c.id !== club.id)
                              );
                            }}
                            className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-medium text-red-800 hover:bg-red-200"
                          >
                            Delete
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
