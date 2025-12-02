"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopProductOpen, setDesktopProductOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const productBtnRef = useRef(null);
  const router = useRouter();

  // Read localStorage user on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("user");
        if (u) setCurrentUser(JSON.parse(u));
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, []);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    setCurrentUser(null);
    router.push("/");
  };

  return (
    <header className="bg-white">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">HiveFinder</span>
            <img src="/logo.png" alt="HiveFinder logo" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            aria-label="Open main menu"
            onClick={() => setMobileOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
              className="size-6"
            >
              <path
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Desktop nav group */}
        <div className="hidden lg:flex lg:gap-x-12">
          <Link href="/" className="text-sm/6 font-semibold text-black">
            Home
          </Link>
          <Link href="/clubPage" className="text-sm/6 font-semibold text-black">
            Club
          </Link>
          <Link href="/friendFinder" className="text-sm/6 font-semibold text-black">
            Friend Finder
          </Link>

          {/* Desktop Account popover */}
          <div className="relative">
            <button
              ref={productBtnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={desktopProductOpen}
              onClick={() => setDesktopProductOpen((s) => !s)}
              onBlur={() => {
              setTimeout(() => {
                const btn = productBtnRef.current;
                const menu = document.getElementById("desktop-menu-account");
                const active = document.activeElement;

                if (
                  btn &&
                  !btn.contains(active) &&
                  !menu?.contains(active)
                ) {
                  setDesktopProductOpen(false);
                }
              }, 0);
            }}

              className="flex items-center gap-x-1 text-sm/6 font-semibold text-black"
            >
              Account
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="size-5 flex-none text-gray-500"
              >
                <path
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                  fillRule="evenodd"
                />
              </svg>
            </button>

            {desktopProductOpen && (
              <div
                id="desktop-menu-account"
                role="menu"
                aria-label="Account"
                tabIndex={-1}
                className="absolute z-50 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white outline outline-1 -outline-offset-1 outline-white/10"
              >
                <div className="p-4">
                  {/* My Account */}
                  <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50">
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-200/50">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                        className="size-6 text-gray-600"
                      >
                        <path
                          d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4.5 21a8.25 8.25 0 1 1 15 0"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-auto">
                      {/* 🔑 gate My Account based on localStorage at click-time */}
                      <Link
                        href="/account"
                        onClick={(e) => {
                          e.preventDefault();
                          if (typeof window !== "undefined" && localStorage.getItem("user")) {
                            router.push("/account");
                          } else {
                            router.push("/login");
                          }
                        }}
                        className="block font-semibold text-black"
                      >
                        My Account
                        <span className="absolute inset-0" />
                      </Link>
                      <p className="mt-1 text-gray-500">Profile and settings</p>
                    </div>
                  </div>

                  {/* Club Admin */}
                  <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50">
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-200/50">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                        className="size-6 text-gray-600"
                      >
                        <path
                          d="M3 7.5h18M6 12h12M9 16.5h6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-auto">
                      <Link href="/clubAdmin" className="block font-semibold text-black">
                        Club Administration
                        <span className="absolute inset-0" />
                      </Link>
                      <p className="mt-1 text-gray-500">Manage clubs</p>
                    </div>
                  </div>

                  {/* IF LOGGED OUT → show Login/Signup cards */}
                  {!currentUser && (
                    <>
                      {/* Log In */}
                      <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50">
                        <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-200/50">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            aria-hidden="true"
                            className="size-6 text-gray-600"
                          >
                            <path
                              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-9A2.25 2.25 0 0 0 2.25 5.25v13.5A2.25 2.25 0 0 0 4.5 21h9a2.25 2.25 0 0 0 2.25-2.25V15"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M18 12H7.5m0 0 3-3m-3 3 3 3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="flex-auto">
                          <Link href="/login" className="block font-semibold text-black">
                            Log In
                            <span className="absolute inset-0" />
                          </Link>
                          <p className="mt-1 text-gray-500">Access your account</p>
                        </div>
                      </div>

                      {/* Sign Up */}
                      <div className="group relative flex.items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50">
                        <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-200/50">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            aria-hidden="true"
                            className="size-6 text-gray-600"
                          >
                            <path
                              d="M12 6v12M6 12h12"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="flex-auto">
                          <Link href="/signUp" className="block font-semibold text-black">
                            Sign Up
                            <span className="absolute inset-0" />
                          </Link>
                          <p className="mt-1 text-gray-500">Create your.account</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* IF LOGGED IN → show greeting + sign out */}
                  {currentUser && (
                    <div className="p-4">
                      <p className="text-sm font-semibold text-black mb-2">
                        Hi {currentUser.username}!
                      </p>
                      <button
                        onClick={handleSignOut}
                        className="text-sm text-red-600 font-semibold"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side auth links */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-4">
          {currentUser ? (
            <>
              <span className="text-sm/6 font-semibold text-black">
                Hi {currentUser.username}!
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm/6 font-semibold text-black"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm/6 font-semibold text-black">
                Log in <span aria-hidden="true">→</span>
              </Link>
              <Link href="/signUp" className="text-sm/6 font-semibold text-black">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/30"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[#c4ceb2] p-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5">
                <span className="sr-only">HiveFinder</span>
                <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-900"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  className="size-6"
                >
                  <path
                    d="M6 18 18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-6 flow-root">
              <div className="-my-6.divide-y divide-white/10">
                <div className="space-y-2 py-6">
                  <Link
                    href="/"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-white/5"
                  >
                    Home
                  </Link>
                  <Link
                    href="/clubPage"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-white/5"
                  >
                    Club
                  </Link>
                  <Link
                    href="/friendFinder"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-white/5"
                  >
                    Friend Finder
                  </Link>

                  <div className="-mx-3">
                    <button
                      type="button"
                      aria-controls="mobile-account"
                      aria-expanded={mobileProductsOpen}
                      onClick={() => setMobileProductsOpen((s) => !s)}
                      className="flex w-full items-center justify-between rounded-lg.py-2 pr-3.5 pl-3 text-base font-semibold text-black hover:bg-white/5"
                    >
                      Account
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                        className={`size-5 flex-none transition-transform ${
                          mobileProductsOpen ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                          fillRule="evenodd"
                        />
                      </svg>
                    </button>

                    {mobileProductsOpen && (
                      <div
                        id="mobile-account"
                        className="mt-2 space-y-2"
                        role="group"
                        aria-label="Account"
                      >
                        {/* 🔑 Mobile My Account gate */}
                        <Link
                          href="/account"
                          onClick={(e) => {
                            e.preventDefault();
                            if (typeof window !== "undefined" && localStorage.getItem("user")) {
                              router.push("/account");
                            } else {
                              router.push("/login");
                            }
                          }}
                          className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5"
                        >
                          My Account
                        </Link>
                        <Link
                          href="/clubAdmin"
                          className="block rounded-lg.py-2 pr-3 pl-6 text-sm.font-semibold text-black hover:bg-white/5"
                        >
                          Club Administration
                        </Link>

                        {!currentUser ? (
                          <>
                            <Link
                              href="/login"
                              className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5"
                            >
                              Log in
                            </Link>
                            <Link
                              href="/signUp"
                              className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5"
                            >
                              Sign up
                            </Link>
                          </>
                        ) : (
                          <>
                            <div className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black">
                              Hi {currentUser.username}!
                            </div>
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5"
                            >
                              Sign out
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="py-6" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
