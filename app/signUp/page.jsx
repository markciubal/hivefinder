"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth/AuthProvider";
import PageShell from "../components/layout/PageShell";
import { USERNAME_HINT, usernameError } from "../../lib/username";

/**
 * Signing up: a username and a password, and nothing else.
 *
 * No email address is collected, which means there is no reset link and no
 * support path - if the password is lost, so is the account. That is a
 * deliberate trade (nothing to leak, nothing to spam, nothing to hand over),
 * but it only works if people are told plainly and given somewhere to put the
 * password before they leave this page. Hence the second step below, which is
 * the only time the password is ever shown back to them.
 */

/** CRLF: this is a .txt file people will open in whatever their OS gives them. */
function credentialsFileText({ username, password, origin }) {
  return (
    [
      "HiveFinder login details",
      "========================",
      "",
      `Site:     ${origin}/login`,
      `Username: ${username}`,
      `Password: ${password}`,
      `Saved:    ${new Date().toLocaleString()}`,
      "",
      "HiveFinder does not store an email address for this account. There is no",
      "reset link, and nobody can confirm the account is yours. If this password",
      "is lost, the account cannot be recovered.",
      "",
      "Anyone who can read this file can sign in as you. Keep it somewhere only",
      "you can reach - better still, put these details in a password manager and",
      "delete this file.",
      "",
    ].join("\r\n")
  );
}

function SaveCredentials({ username, password, onDone, storageWarning }) {
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [stored, setStored] = useState("");

  // A data: URL rather than a blob: one, so there is nothing to create in an
  // effect and nothing to revoke. This step only ever renders after a
  // successful submit, so it never runs on the server.
  const downloadUrl = useMemo(
    () =>
      "data:text/plain;charset=utf-8," +
      encodeURIComponent(
        credentialsFileText({
          username,
          password,
          origin: window.location.origin,
        })
      ),
    [username, password]
  );

  // Chromium's credential manager, and only over https or localhost.
  const canStore =
    "PasswordCredential" in window &&
    typeof navigator.credentials?.store === "function";

  async function saveToBrowser() {
    try {
      await navigator.credentials.store(
        new window.PasswordCredential({
          id: username,
          password,
          name: username,
        })
      );
      setStored("ok");
    } catch {
      // Declining the browser prompt lands here too, so this is a nudge, not
      // an error to make a fuss about.
      setStored("failed");
    }
  }

  return (
    <PageShell
      title="Save your password"
      description="This is the only time we can show it to you."
      width="sm"
    >
      <div className="hf-card space-y-5 p-6">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">
            Your account is ready — but there is no way to reset this password.
          </p>
          <p className="mt-1">
            We never asked for your email, so we cannot send you a reset link,
            and no moderator can prove the account is yours. Put the password
            somewhere safe before you carry on.
          </p>
        </div>

        {storageWarning && (
          <p className="text-sm text-amber-800">{storageWarning}</p>
        )}

        <div className="rounded-xl border border-gray-200 bg-[var(--hf-surface-alt)] p-4 text-sm">
          <dl>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-semibold text-black">Username</dt>
              <dd className="font-mono break-all text-black">{username}</dd>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-4">
              <dt className="font-semibold text-black">Password</dt>
              <dd className="font-mono break-all text-black">
                {revealed
                  ? password
                  : "•".repeat(Math.min(password.length, 24))}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="mt-3 text-xs font-semibold text-gray-600 underline hover:text-black"
          >
            {revealed ? "Hide password" : "Show password"}
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-black">
            Pick at least one:
          </p>

          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span aria-hidden="true">1.</span>
              <span>Save it in your password manager</span>
              {canStore && (
                <button
                  type="button"
                  onClick={saveToBrowser}
                  className="hf-btn hf-btn-secondary px-3 py-1 text-xs"
                >
                  Save to this browser
                </button>
              )}
              {stored === "ok" && (
                <span className="text-xs text-green-700">Saved.</span>
              )}
              {stored === "failed" && (
                <span className="text-xs text-gray-500">
                  Not saved — use your manager&rsquo;s own &ldquo;add
                  login&rdquo; instead.
                </span>
              )}
            </li>

            <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span aria-hidden="true">2.</span>
              <span>Write it down on paper and keep it somewhere private</span>
            </li>

            <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span aria-hidden="true">3.</span>
              <a
                href={downloadUrl}
                download={`hivefinder-login-${username}.txt`}
                className="font-semibold text-[var(--hf-green)] underline"
              >
                Download a file with these details
              </a>
              <span className="text-xs text-gray-500">
                (plain text — anyone who opens it can sign in as you)
              </span>
            </li>
          </ul>
        </div>

        <label className="flex items-start gap-3 border-t border-gray-200 pt-4 text-sm text-black">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span>I have saved my password somewhere I can get it back.</span>
        </label>

        <button
          type="button"
          disabled={!confirmed}
          onClick={onDone}
          className="hf-btn hf-btn-primary w-full disabled:opacity-50"
        >
          Continue to HiveFinder
        </button>
      </div>
    </PageShell>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const badUsername = usernameError(username);
    if (badUsername) {
      setError(badUsername);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // README FR1 asks for auto-login after registration, so the session is
      // established here. The save-your-password step comes after, rather than
      // dropping people straight into the app with a password they have not
      // written down anywhere.
      const persisted = data.token && data.user ? signIn(data.token, data.user) : false;

      setCreated({
        username: data.user?.username || username.trim(),
        password,
        storageWarning: persisted
          ? ""
          : "This browser is blocking site storage, so you will be signed out on reload. You will need this password to get back in.",
      });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <SaveCredentials
        username={created.username}
        password={created.password}
        storageWarning={created.storageWarning}
        onDone={() => router.push("/")}
      />
    );
  }

  return (
    <PageShell
      title="Create your account"
      description="A username and a password. We do not ask for your email."
      width="sm"
    >
      <form onSubmit={onSubmit} className="hf-card space-y-4 p-6">
        <p className="rounded-xl border border-gray-200 bg-[var(--hf-surface-alt)] p-4 text-sm text-gray-700">
          HiveFinder stores no email address, so there is nothing to send a
          reset link to. Use a password manager, or be ready to write your
          password down on the next screen.
        </p>

        <div>
          <label className="hf-label" htmlFor="su-username">
            Username
          </label>
          <input
            id="su-username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="hf-input"
            placeholder="yourname"
          />
          <p className="mt-1 text-xs text-gray-500">{USERNAME_HINT}</p>
        </div>

        <div>
          <label className="hf-label" htmlFor="su-password">
            Password
          </label>
          <input
            id="su-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hf-input"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="hf-label" htmlFor="su-confirm">
            Confirm password
          </label>
          <input
            id="su-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="hf-input"
            placeholder="Repeat your password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="hf-btn hf-btn-primary w-full"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>

        <p className="pt-2 text-center text-sm text-gray-600">
          <Link href="/login" className="underline hover:text-black">
            Already have an account?
          </Link>
        </p>
      </form>
    </PageShell>
  );
}
