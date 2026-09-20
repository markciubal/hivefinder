import React from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";

export default function Page() {
  return (
    <PageShell title="Club pinboard" description="Announcements from the clubs you have joined." width="md">
      <div className="hf-card p-8 text-center">
        <p className="text-sm text-gray-600">The member pinboard is still being built. Club announcements will appear here once it is connected.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/hives" className="hf-btn hf-btn-primary">
            Browse clubs
          </Link>
          <Link href="/" className="hf-btn hf-btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
