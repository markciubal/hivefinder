// app/clubAdmin/ClubAdminClient.jsx
"use client";

import React, { useState } from "react";

export default function ClubAdminClient({ clubs }) {
  const [localClubs, setLocalClubs] = useState(clubs || []);

  const handleQuarantineClick = (id) => {
    // TODO: wire up to an API route when ready
    alert("Quarantine action not implemented yet. This is just a stub.");
  };

  const handleDeleteClick = (id) => {
    // TODO: wire up to an API route; for now we just update UI
    const sure = window.confirm(
      "Delete this club? This will be permanent once wired up."
    );
    if (!sure) return;

    setLocalClubs((prev) => prev.filter((club) => club.id !== id));
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Club Admin Dashboard
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            View and manage all clubs. Only visible to the SUPERUSER account.
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

      {/* Club table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-center">Members</th>
              <th className="px-3 py-2 text-center">Moderators</th>
              <th className="px-3 py-2 text-center">Created</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {localClubs.map((club) => (
              <tr key={club.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 align-top">
                  <div className="text-xs font-medium text-gray-900">
                    {club.name}
                  </div>
                </td>
                <td className="max-w-md px-3 py-2 align-top">
                  <p className="line-clamp-3 text-[11px] text-gray-700">
                    {club.description || "No description"}
                  </p>
                </td>
                <td className="px-3 py-2 text-center align-top text-[11px]">
                  {club._count?.members ?? 0}
                </td>
                <td className="px-3 py-2 text-center align-top text-[11px]">
                  {club._count?.moderators ?? 0}
                </td>
                <td className="px-3 py-2 text-center align-top text-[11px]">
                  {club.createdAt
                    ? new Date(club.createdAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right align-top">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuarantineClick(club.id)}
                      className="rounded-full bg-yellow-100 px-3 py-1 text-[10px] font-medium text-yellow-800 hover:bg-yellow-200"
                    >
                      Quarantine
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(club.id)}
                      className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-medium text-red-800 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {localClubs.length === 0 && (
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
    </section>
  );
}
