"use client";

import { useEffect, useState } from "react";
import interestsList from "../../utilities/interests.json";
import PageShell from "../components/layout/PageShell";
import RequireAuth, { DemoBanner } from "../components/auth/RequireAuth";
import { useSignInPrompt } from "../components/auth/SignInPrompt";
import { useAuth } from "../components/auth/AuthProvider";
import ThemePicker from "../components/theme/ThemePicker";
import LocationSharing from "../components/events/LocationSharing";
import { DEMO_PROFILE } from "../lib/demoData";

/**
 * The account form. `onSave` is null in demo mode, which turns the submit
 * button into a sign-up prompt instead of a network call.
 */
function AccountForm({ profile, onSave, saving, err, msg, demo, onDemoAction }) {
  const [firstName, setFirst] = useState(profile.firstName || "");
  const [lastName, setLast] = useState(profile.lastName || "");
  const [about, setAbout] = useState(profile.about || "");
  const [selectedInterests, setSelectedInterests] = useState(
    profile.interests || []
  );
  const [interestsOpen, setInterestsOpen] = useState(false);

  function toggleInterest(interest) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (demo) {
      onDemoAction("saving your profile");
      return;
    }
    onSave({ firstName, lastName, about, interests: selectedInterests });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="hf-card p-6">
        <h2 className="text-lg font-bold text-black">Basic information</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="hf-label" htmlFor="acct-username">
              Username
            </label>
            <input
              id="acct-username"
              className="hf-input bg-gray-100 text-gray-700"
              value={profile.username || ""}
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">
              This is what you sign in with. It cannot be changed yet.
            </p>
          </div>

          <div>
            <label className="hf-label" htmlFor="acct-first">
              First name
            </label>
            <input
              id="acct-first"
              className="hf-input"
              value={firstName}
              onChange={(e) => setFirst(e.target.value)}
            />
          </div>

          <div>
            <label className="hf-label" htmlFor="acct-last">
              Last name
            </label>
            <input
              id="acct-last"
              className="hf-input"
              value={lastName}
              onChange={(e) => setLast(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="hf-label" htmlFor="acct-about">
            About me
          </label>
          <textarea
            id="acct-about"
            className="hf-input min-h-[80px]"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
        </div>
      </section>

      <section
        className="hf-card bg-[var(--hf-surface-alt)] p-6"
        data-tour="account-interests"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-black">Interests</h2>
            <p className="text-xs text-gray-600">
              Used by Friend Finder to match you with other students.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInterestsOpen((open) => !open)}
            className="hf-btn hf-btn-primary flex-none"
          >
            {interestsOpen ? "Close" : "Add / Edit"}
          </button>
        </div>

        {selectedInterests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedInterests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--hf-green)] px-2 py-1 text-xs font-medium text-white"
              >
                {interest}
                <button
                  type="button"
                  aria-label={`Remove ${interest}`}
                  onClick={() =>
                    setSelectedInterests((prev) =>
                      prev.filter((i) => i !== interest)
                    )
                  }
                  className="ml-1 text-white/80 hover:text-white"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {interestsOpen && (
          <div className="mt-4 border-t border-gray-300 pt-3">
            <p className="mb-2 text-xs text-gray-600">
              Click to add or remove interests:
            </p>
            <div className="max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex flex-wrap gap-2">
                {interestsList.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={
                        "rounded-full border px-3 py-1 text-xs transition " +
                        (isSelected
                          ? "border-[var(--hf-green)] bg-[var(--hf-green)] text-white"
                          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100")
                      }
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="hf-btn hf-btn-primary">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function AccountDemo() {
  const { promptSignIn, prompt } = useSignInPrompt();

  return (
    <PageShell
      title="Account details"
      description="Your profile and the interests used to match you with other students."
      width="md"
    >
      <DemoBanner what="the profile editor" />
      <AccountForm profile={DEMO_PROFILE} demo onDemoAction={promptSignIn} />

      <section className="hf-card mt-6 p-6">
        <h2 className="text-lg font-bold text-black">Colours</h2>
        <p className="mt-1 text-sm text-gray-600">
          Signed-in students can recolour the whole app, or pick their own
          accent. Every option is contrast-checked so the text stays readable.
        </p>
        <button
          type="button"
          onClick={() => promptSignIn("choosing a colour theme")}
          className="hf-btn hf-btn-primary mt-4"
        >
          Choose a theme
        </button>
      </section>

      {prompt}
    </PageShell>
  );
}

function AccountReal() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to load account (${res.status})`);
        const u = await res.json();
        if (!cancelled) setProfile(u);
      } catch (e) {
        if (!cancelled) setLoadError(e.message || "Could not load your account");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function save(values) {
    setErr("");
    setMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`Failed to save account (${res.status})`);
      setMsg("Saved");
    } catch (e) {
      setErr(e.message || "Network error while saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Account details"
      description="Your profile and the interests used to match you with other students."
      width="md"
    >
      {loadError && (
        <p className="hf-card mb-4 p-4 text-sm text-red-600">{loadError}</p>
      )}
      {!profile && !loadError ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ) : (
        profile && (
          // Keyed on the account id: if a different profile ever loads into
          // this page, the form remounts with that profile's values instead
          // of holding the previous one.
          <>
            <AccountForm
              key={profile.id || profile.username}
              profile={profile}
              onSave={save}
              saving={saving}
              err={err}
              msg={msg}
            />

            {/* Preferences save on their own, so they sit outside the
                profile form rather than sharing its submit button. */}
            <div className="mt-6 space-y-6">
              <div data-tour="account-colours">
                <ThemePicker />
              </div>

              <section className="hf-card p-6">
                <h2 className="text-lg font-bold text-black">Location sharing</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Event locations are hidden until you turn this on, and a
                  location you post stays hidden from anyone who has not.
                </p>
                <div className="mt-4">
                  <LocationSharing />
                </div>
              </section>
            </div>
          </>
        )
      )}
    </PageShell>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth what="your account" fallback={<AccountDemo />}>
      <AccountReal />
    </RequireAuth>
  );
}
