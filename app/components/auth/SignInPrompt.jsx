"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";

/**
 * Modal used for the two dead ends a page can hit:
 *
 *  - "auth": a signed-out visitor triggered an action inside a demo preview.
 *  - "unavailable": the action is not built yet, for anyone.
 *
 * They share a shell so the app does not grow two different-looking dialogs.
 */
export function SignInPromptModal({ request, onClose }) {
  if (!request) return null;

  const { action, variant } = request;
  const isAuth = variant === "auth";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isAuth ? "Sign in required" : "Not available yet"}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-black">
          {isAuth ? "Account needed" : "Not available yet"}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isAuth
            ? `You are in demo mode, so ${action} is disabled. Create a free account to use it for real.`
            : `${action} is still being built. It is not connected to anything yet.`}
        </p>

        {isAuth ? (
          <>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/signUp" className="hf-btn hf-btn-primary flex-1">
                Sign up
              </Link>
              <Link href="/login" className="hf-btn hf-btn-secondary flex-1">
                Log in
              </Link>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-xs font-semibold text-gray-500 hover:text-gray-800"
            >
              Keep looking around
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="hf-btn hf-btn-primary mt-6 w-full"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Wires the modal up for a page:
 *
 *   const { promptSignIn, promptUnavailable, prompt } = useSignInPrompt();
 *   <button onClick={() => promptSignIn("joining a club")}>Join</button>
 *   {prompt}
 */
export function useSignInPrompt() {
  const [request, setRequest] = useState(null);
  const close = useCallback(() => setRequest(null), []);

  const promptSignIn = useCallback(
    (action) => setRequest({ action, variant: "auth" }),
    []
  );
  const promptUnavailable = useCallback(
    (action) => setRequest({ action, variant: "unavailable" }),
    []
  );

  return {
    promptSignIn,
    promptUnavailable,
    prompt: <SignInPromptModal request={request} onClose={close} />,
  };
}
