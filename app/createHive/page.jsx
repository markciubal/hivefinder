"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageShell from "../components/layout/PageShell";
import RequireAuth, { DemoBanner } from "../components/auth/RequireAuth";
import { useSignInPrompt } from "../components/auth/SignInPrompt";
import { useAuth } from "../components/auth/AuthProvider";
import KindBadge from "../components/clubs/KindBadge";
import { HIVE, isCampusDirectoryUrl } from "../lib/clubKind";
import { DEMO_HIVE_DRAFT } from "../lib/demoData";

const EMPTY = {
  name: "",
  description: "",
  categories: "",
  fields: "",
  clubUrl: "",
};

/**
 * Creating a hive, not a club.
 *
 * Students cannot create official clubs here — those come from the university
 * roster. The form says so plainly rather than letting someone fill it in and
 * discover the distinction from a 409.
 *
 * Note there is no points field. Points drive the official directory's default
 * sort, and letting a creator set their own was how a hive could rank itself
 * above real clubs. The API ignores the value regardless; the field is gone so
 * nobody expects otherwise.
 */
function HiveForm({ initial, onSubmit, error, msg, submitting, demo, onDemoAction }) {
  const [values, setValues] = useState(initial);
  const [urlWarning, setUrlWarning] = useState("");

  const set = (key) => (e) => {
    const { value } = e.target;
    setValues((prev) => ({ ...prev, [key]: value }));

    // Mirror the server's guard so the problem surfaces while typing rather
    // than on submit.
    if (key === "clubUrl") {
      setUrlWarning(
        isCampusDirectoryUrl(value)
          ? "That is a university page. A hive has to link somewhere of its own."
          : ""
      );
    }
  };

  function handleSubmit(e) {
    e.preventDefault();
    if (demo) {
      onDemoAction("creating a hive");
      return;
    }
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="hf-card space-y-4 p-6">
      <div>
        <label className="hf-label" htmlFor="hive-name">
          Hive name
        </label>
        <input
          id="hive-name"
          className="hf-input"
          required={!demo}
          value={values.name}
          onChange={set("name")}
          placeholder="Thursday Board Game Night"
        />
        <p className="mt-1 text-xs text-gray-500">
          Names already used by an official Sac State club are not available.
        </p>
      </div>

      <div>
        <label className="hf-label" htmlFor="hive-description">
          Description
        </label>
        <textarea
          id="hive-description"
          className="hf-input"
          rows={3}
          value={values.description}
          onChange={set("description")}
          placeholder="What do you do, and when?"
        />
      </div>

      <div>
        <label className="hf-label" htmlFor="hive-categories">
          Categories
        </label>
        <input
          id="hive-categories"
          className="hf-input"
          value={values.categories}
          onChange={set("categories")}
          placeholder="Social, Games"
        />
        <p className="mt-1 text-xs text-gray-500">Separate with commas.</p>
      </div>

      <div>
        <label className="hf-label" htmlFor="hive-fields">
          Fields of study
        </label>
        <input
          id="hive-fields"
          className="hf-input"
          value={values.fields}
          onChange={set("fields")}
          placeholder="Computer Science, Business…"
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate with commas, or leave blank if anyone is welcome.
        </p>
      </div>

      <div>
        <label className="hf-label" htmlFor="hive-url">
          Link (optional)
        </label>
        <input
          id="hive-url"
          className="hf-input"
          value={values.clubUrl}
          onChange={set("clubUrl")}
          placeholder="https://discord.gg/…"
        />
        {urlWarning ? (
          <p className="mt-1 text-xs font-semibold text-red-600">{urlWarning}</p>
        ) : (
          <p className="mt-1 text-xs text-gray-500">
            A Discord invite, group chat or site. Not a csus.edu page.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <button
        type="submit"
        disabled={submitting || Boolean(urlWarning)}
        className="hf-btn hf-btn-primary w-full"
      >
        {submitting ? "Creating…" : "Create hive"}
      </button>
    </form>
  );
}

/** Explains the tier before the form, on both the real and demo paths. */
function WhatIsAHive() {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <KindBadge kind={HIVE} />
        <span className="text-sm font-semibold text-amber-900">
          You are creating a hive, not an official club.
        </span>
      </div>
      <p className="mt-2 text-sm text-amber-900/80">
        Hives are groups students run themselves. They appear in their own
        directory and carry no university affiliation. Official clubs come from
        Sacramento State&apos;s roster — if you help run one and want to manage
        its listing,{" "}
        <Link href="/contact" className="font-semibold underline">
          get in touch
        </Link>{" "}
        instead of creating a hive with the same name.
      </p>
    </div>
  );
}

function CreateHiveDemo() {
  const { promptSignIn, prompt } = useSignInPrompt();

  return (
    <PageShell
      title="Create a hive"
      description="Start a student-run group and let people find it."
      width="sm"
    >
      <DemoBanner
        what="the hive builder"
        reason="The form below is prefilled with a sample hive so you can see what is asked for. Submitting needs an account."
      />
      <WhatIsAHive />
      <HiveForm initial={DEMO_HIVE_DRAFT} demo onDemoAction={promptSignIn} />
      {prompt}
    </PageShell>
  );
}

function CreateHiveReal() {
  const router = useRouter();
  const { token } = useAuth();
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitHive(values) {
    setError("");
    setMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/clubs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          categories: values.categories
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          fieldsOfStudy: values.fields
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          clubUrl: values.clubUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to create the hive");
        return;
      }

      setMsg("Hive created!");
      setTimeout(() => router.push("/hives"), 900);
    } catch {
      setError("Network error while creating the hive");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Create a hive"
      description="Start a student-run group and let people find it."
      width="sm"
    >
      <WhatIsAHive />
      <HiveForm
        initial={EMPTY}
        onSubmit={submitHive}
        error={error}
        msg={msg}
        submitting={submitting}
      />
    </PageShell>
  );
}

export default function CreateHivePage() {
  return (
    <RequireAuth what="hive creation" fallback={<CreateHiveDemo />}>
      <CreateHiveReal />
    </RequireAuth>
  );
}
