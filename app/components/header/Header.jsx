"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth/AuthProvider";
import { NAV, visibleItems } from "./navConfig";
import NotificationBell from "../notifications/NotificationBell";

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={`size-5 flex-none text-gray-500 transition-transform ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
        fillRule="evenodd"
      />
    </svg>
  );
}

/**
 * Renders a nav destination, which may be off-site.
 *
 * "Browse Clubs" points at CampusGroups: Sacramento State runs the official
 * directory and it is the only one that can enrol you, so HiveFinder links out
 * rather than mirroring it.
 */
function NavLink({ item, className, children }) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className}>
      {children}
    </Link>
  );
}

/** Small padlock shown next to links that will land on a demo preview. */
function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="size-3 flex-none text-gray-400"
    >
      <path
        d="M6 10V7a6 6 0 1 1 12 0v3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="4" y="10" width="16" height="10" rx="2" />
    </svg>
  );
}

export default function Header() {
  const { user, status, isAuthenticated, isSuperuser, isModerator, signOut } =
    useAuth();
  const pathname = usePathname();

  // Menu state carries the path it was opened on. When the path changes the
  // stored state is stale, so it reads as closed — that closes every menu on
  // navigation without an effect that resets state after the fact.
  const CLOSED = { path: pathname, mobile: false, desktop: null, section: null };
  const [menuState, setMenuState] = useState(CLOSED);
  const menus = menuState.path === pathname ? menuState : CLOSED;

  const mobileOpen = menus.mobile;
  const openDesktop = menus.desktop;
  const openMobile = menus.section;

  const setMobileOpen = (mobile) =>
    setMenuState({ ...menus, path: pathname, mobile });
  const setOpenDesktop = (desktop) =>
    setMenuState({ ...menus, path: pathname, desktop });
  const setOpenMobile = (section) =>
    setMenuState({ ...menus, path: pathname, section });

  const navRef = useRef(null);

  // Escape closes menus; a click outside closes the desktop dropdown.
  // These use functional updates so the listeners, registered once, never
  // read a stale `menus`/`pathname` from their closure.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setMenuState((prev) => ({ ...prev, desktop: null, mobile: false }));
    };
    const onPointerDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuState((prev) => ({ ...prev, desktop: null }));
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  // The mobile panel is a full-screen overlay; stop the page behind scrolling.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));

  const linkBase = "text-sm/6 font-semibold transition-colors";
  const topLink = (href) =>
    `${linkBase} ${
      isActive(href)
        ? "text-[var(--hf-green)] underline underline-offset-8 decoration-2"
        : "text-black hover:text-[var(--hf-green)]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <nav
        ref={navRef}
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8"
      >
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">HiveFinder home</span>
            <img src="/logo.png" alt="HiveFinder" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 lg:hidden">
          <NotificationBell key={user?.id || "anon"} />
          <button
            type="button"
            aria-label="Open main menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-600 hover:bg-gray-100"
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

        {/* Desktop nav */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-10">
          {NAV.map((entry) => {
            if (!entry.items) {
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={topLink(entry.href)}
                >
                  {entry.label}
                </Link>
              );
            }

            const items = visibleItems(entry.items, { isSuperuser, isModerator });
            if (items.length === 0) return null;
            const open = openDesktop === entry.id;

            return (
              <div key={entry.id} className="relative">
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={open}
                  onClick={() => setOpenDesktop(open ? null : entry.id)}
                  className={`flex items-center gap-x-1 ${linkBase} text-black hover:text-[var(--hf-green)]`}
                >
                  {entry.label}
                  <ChevronIcon open={open} />
                </button>

                {open && (
                  <div
                    role="menu"
                    aria-label={entry.label}
                    className="absolute left-1/2 z-50 mt-3 w-72 -translate-x-1/2 overflow-hidden rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5"
                  >
                    {items.map((item) => {
                      const locked = item.auth && !isAuthenticated;
                      return (
                        <NavLink
                          key={item.href}
                          item={item}
                          className="block rounded-lg px-3 py-2 hover:bg-gray-50"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-black">
                            {item.label}
                            {locked && <LockIcon />}
                            {item.external && (
                              <span aria-hidden="true" className="text-gray-400">
                                &#8599;
                              </span>
                            )}
                          </span>
                          {item.description && (
                            <span className="mt-0.5 block text-xs text-gray-500">
                              {locked
                                ? "Preview available without an account"
                                : item.description}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop auth actions */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-4">
          {status === "loading" ? (
            <span
              aria-hidden="true"
              className="h-5 w-32 animate-pulse rounded bg-gray-100"
            />
          ) : isAuthenticated ? (
            <>
              <NotificationBell key={user?.id || "anon"} />
              <span className="text-sm/6 font-semibold text-black">
                Hi {user.username || user.email}!
              </span>
              <button
                type="button"
                onClick={signOut}
                className="text-sm/6 font-semibold text-gray-600 hover:text-black"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm/6 font-semibold text-black hover:text-[var(--hf-green)]"
              >
                Log in
              </Link>
              <Link href="/signUp" className="hf-btn hf-btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/30"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-200">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5">
                <span className="sr-only">HiveFinder home</span>
                <img src="/logo.png" alt="HiveFinder" className="h-8 w-auto" />
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-600 hover:bg-gray-100"
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

            <div className="mt-6 divide-y divide-gray-200">
              <div className="space-y-1 pb-6">
                {NAV.map((entry) => {
                  if (!entry.items) {
                    return (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        className={`block rounded-lg px-3 py-2 text-base font-semibold hover:bg-gray-50 ${
                          isActive(entry.href)
                            ? "text-[var(--hf-green)]"
                            : "text-black"
                        }`}
                      >
                        {entry.label}
                      </Link>
                    );
                  }

                  const items = visibleItems(entry.items, { isSuperuser, isModerator });
                  if (items.length === 0) return null;
                  const open = openMobile === entry.id;

                  return (
                    <div key={entry.id}>
                      <button
                        type="button"
                        aria-controls={`mobile-${entry.id}`}
                        aria-expanded={open}
                        onClick={() => setOpenMobile(open ? null : entry.id)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-gray-50"
                      >
                        {entry.label}
                        <ChevronIcon open={open} />
                      </button>

                      {open && (
                        <div
                          id={`mobile-${entry.id}`}
                          className="mt-1 space-y-1"
                        >
                          {items.map((item) => {
                            const locked = item.auth && !isAuthenticated;
                            return (
                              <NavLink
                                key={item.href}
                                item={item}
                                className="flex items-center gap-2 rounded-lg py-2 pl-6 pr-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                {item.label}
                                {locked && <LockIcon />}
                                {item.external && (
                                  <span aria-hidden="true" className="text-gray-400">
                                    &#8599;
                                  </span>
                                )}
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-6">
                {isAuthenticated ? (
                  <>
                    <p className="px-3 text-sm font-semibold text-black">
                      Hi {user.username || user.email}!
                    </p>
                    <button
                      type="button"
                      onClick={signOut}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-gray-50"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signUp"
                      className="hf-btn hf-btn-primary mt-2 w-full"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
