"use client";

import Link from "next/link";
import PageShell from "../components/layout/PageShell";

/**
 * There is no password reset, and this page exists to say so.
 *
 * It used to email a reset link. HiveFinder no longer stores an email address
 * for anyone, so there is nowhere to send one - and no way to tell the account
 * holder apart from someone who wants their account. The honest version is to
 * point people at the places their password might be and to be clear about
 * what happens if it is not there.
 *
 * The route name stays /forgotPassword because that is what the login page has
 * always linked to, and it is the thing people search for.
 */
export default function ForgotPasswordPage() {
  return (
    <PageShell
      title="Lost your password?"
      description="HiveFinder has no email address for you, so there is no reset link."
      width="sm"
    >
      <div className="hf-card space-y-5 p-6 text-sm text-gray-700">
        <p>
          An account here is only a username and a password. That means nothing
          to leak and nothing to spam — but it also means we cannot send you a
          reset link, and no moderator can check that an account is yours.
        </p>

        <div>
          <h2 className="text-base font-bold text-black">Worth checking</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Your password manager, or your browser&rsquo;s saved passwords —
              look for this site&rsquo;s address.
            </li>
            <li>
              Your downloads folder, for a file named{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">
                hivefinder-login-&lt;username&gt;.txt
              </code>
              , offered when you signed up.
            </li>
            <li>Wherever you write passwords down.</li>
          </ul>
        </div>

        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          If none of those turn it up, the account cannot be recovered. You can
          create a new one — you will need to rejoin your hives and your old
          messages stay with the old account.
        </p>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <Link href="/login" className="hf-btn hf-btn-secondary flex-1">
            Back to log in
          </Link>
          <Link href="/signUp" className="hf-btn hf-btn-primary flex-1">
            Create a new account
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
