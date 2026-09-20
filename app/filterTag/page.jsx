import React from "react";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";

export default function Page() {
  return (
    <PageShell title="Filter by tag" description="Narrow clubs and events down to the tags you care about." width="md">
      <div className="hf-card p-8 text-center">
        <p className="text-sm text-gray-600">Tag filtering is still being built. In the meantime, the club directory has category and field-of-study filters you can use right now.</p>
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
