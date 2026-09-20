"use client";

import { useState } from "react";
import PageShell from "../components/layout/PageShell";
import RequireAuth, { DemoBanner } from "../components/auth/RequireAuth";
import { useSignInPrompt } from "../components/auth/SignInPrompt";
import KindBadge from "../components/clubs/KindBadge";
import { HIVE } from "../lib/clubKind";
import { DEMO_HIVE_DRAFT } from "../lib/demoData";

const EMPTY = { email: "", clubUrl: "", description: "", tagInput: "", tags: [] };

function ModifyClubForm({ initial, demo, onDemoAction }) {
  const [values, setValues] = useState(initial);
  const [notice, setNotice] = useState("");

  const set = (key) => (e) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }));

  function addTag(e) {
    e.preventDefault();
    const tag = values.tagInput.trim();
    if (!tag || values.tags.includes(tag)) return;
    setValues((prev) => ({ ...prev, tags: [...prev.tags, tag], tagInput: "" }));
  }

  function removeTag(tag) {
    setValues((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (demo) {
      onDemoAction("editing a hive");
      return;
    }
    // There is no PATCH /api/clubs/[id] endpoint yet, so say so rather than
    // silently doing nothing (which is what this button used to do).
    setNotice(
      "Saving hive edits is not connected to the backend yet. Your changes have not been stored."
    );
  }

  return (
    <form onSubmit={handleSubmit} className="hf-card space-y-4 p-6">
      <div>
        <label className="hf-label" htmlFor="mc-email">
          Hive email
        </label>
        <input
          id="mc-email"
          type="email"
          className="hf-input"
          value={values.email}
          onChange={set("email")}
          placeholder="hive@example.edu"
        />
      </div>

      <div>
        <label className="hf-label" htmlFor="mc-url">
          Website
        </label>
        <input
          id="mc-url"
          className="hf-input"
          value={values.clubUrl}
          onChange={set("clubUrl")}
          placeholder="https://discord.gg/…"
        />
      </div>

      <div>
        <label className="hf-label" htmlFor="mc-description">
          Description
        </label>
        <textarea
          id="mc-description"
          className="hf-input min-h-[120px]"
          value={values.description}
          onChange={set("description")}
          placeholder="Describe the hive or what it does"
        />
      </div>

      <div>
        <label className="hf-label" htmlFor="mc-tags">
          Tags
        </label>
        <div className="flex gap-2">
          <input
            id="mc-tags"
            className="hf-input"
            value={values.tagInput}
            onChange={set("tagInput")}
            onKeyDown={(e) => e.key === "Enter" && addTag(e)}
            placeholder="Add a tag and press Enter"
          />
          <button
            type="button"
            onClick={addTag}
            className="hf-btn hf-btn-secondary flex-none"
          >
            Add
          </button>
        </div>

        {values.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {values.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-xs text-white"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  onClick={() => removeTag(tag)}
                  className="text-white/70 hover:text-white"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {notice && <p className="text-sm text-amber-700">{notice}</p>}

      <button type="submit" className="hf-btn hf-btn-primary w-full">
        Save changes
      </button>
    </form>
  );
}

function ModifyClubDemo() {
  const { promptSignIn, prompt } = useSignInPrompt();

  return (
    <PageShell
      title="Modify hive information"
      description="Update the details students see on a hive you run."
      width="sm"
    >
      <DemoBanner what="the hive editor" />
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={HIVE} />
          <span className="text-sm font-semibold text-amber-900">
            Hives only.
          </span>
        </div>
        <p className="mt-2 text-sm text-amber-900/80">
          Official club listings come from Sacramento State&apos;s roster and
          cannot be edited here.
        </p>
      </div>

      <ModifyClubForm
        initial={{
          email: DEMO_HIVE_DRAFT.email,
          clubUrl: DEMO_HIVE_DRAFT.clubUrl,
          description: DEMO_HIVE_DRAFT.description,
          tagInput: "",
          tags: DEMO_HIVE_DRAFT.tags,
        }}
        demo
        onDemoAction={promptSignIn}
      />
      {prompt}
    </PageShell>
  );
}

function ModifyClubReal() {
  return (
    <PageShell
      title="Modify hive information"
      description="Update the details students see on a hive you run."
      width="sm"
    >
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={HIVE} />
          <span className="text-sm font-semibold text-amber-900">
            Hives only.
          </span>
        </div>
        <p className="mt-2 text-sm text-amber-900/80">
          Official club listings come from Sacramento State&apos;s roster and
          cannot be edited here.
        </p>
      </div>

      <ModifyClubForm initial={EMPTY} />
    </PageShell>
  );
}

export default function ModifyClubPage() {
  return (
    <RequireAuth what="club editing" fallback={<ModifyClubDemo />}>
      <ModifyClubReal />
    </RequireAuth>
  );
}
