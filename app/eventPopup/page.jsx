"use client";

import PageShell from "../components/layout/PageShell";
import { useSignInPrompt } from "../components/auth/SignInPrompt";
import { useAuth } from "../components/auth/AuthProvider";

/**
 * Preview of the event card that will open from the pinboard. The event
 * itself is sample content until the events API exists.
 */
export default function EventPopupPage() {
  const { isAuthenticated } = useAuth();
  const { promptSignIn, promptUnavailable, prompt } = useSignInPrompt();

  return (
    <PageShell title="Event" description="A preview of how events appear." width="sm">
      <article className="hf-card overflow-hidden">
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Allied Students for Justice
          </p>
          <h2 className="mt-1 text-2xl font-bold text-black">
            Community Potluck
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            University Union, Redwood Room
          </p>
          <p className="text-sm text-gray-600">Thursday, 6:00 PM</p>
        </div>

        <img
          src="/eventpic.jpeg"
          alt="Food laid out at a previous potluck"
          className="h-56 w-full object-cover"
        />

        <div className="p-6">
          <p className="text-sm text-gray-700">
            Allied Students for Justice (ASFJ) is an inclusive platform designed
            to empower students and promote social justice at California State
            University, Sacramento. ASFJ aims to inspire, educate and mobilize
            people towards a more equitable society.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                isAuthenticated
                  ? promptUnavailable("Registering interest in events")
                  : promptSignIn("saving events you are interested in")
              }
              className="hf-btn hf-btn-primary flex-1"
            >
              I&rsquo;m interested!
            </button>
            <button
              type="button"
              aria-label="Get notified about this event"
              onClick={() =>
                isAuthenticated
                  ? promptUnavailable("Event notifications")
                  : promptSignIn("event notifications")
              }
              className="hf-btn hf-btn-secondary"
            >
              <img src="/notif.svg" alt="" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </article>

      {prompt}
    </PageShell>
  );
}
