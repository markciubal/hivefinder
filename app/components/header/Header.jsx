"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const topLinkClass =
  "text-sm/6 font-semibold text-black transition-colors hover:text-gray-700";
const triggerClass =
  "flex items-center gap-x-1 text-sm/6 font-semibold text-black transition-colors hover:text-gray-700";
const desktopDropdownClass =
  "absolute z-50 mt-3 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5";
const desktopMenuItemClass =
  "block px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50";
const mobileLinkClass =
  "-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black transition-colors hover:bg-black/5";
const mobileDisclosureButtonClass =
  "flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base font-semibold text-black transition-colors hover:bg-black/5";
const mobileMenuItemClass =
  "block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black transition-colors hover:bg-black/5";
const sectionLabelClass =
  "px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500";

const desktopLinks = [
  { href: "/", label: "Home" },
  { href: "/friendFinder", label: "Friend Finder" },
];

const clubLinks = [
  { href: "/clubPage", label: "View Clubs" },
  { href: "/createEvent", label: "Create Event", requiresAuth: true },
  { href: "/modifyClub", label: "Modify Club", requiresAuth: true },
  { href: "/createClub", label: "Create Club", requiresAuth: true },
];

const accountLinks = [
  { href: "/account", label: "My Account" },
  { href: "/myClubs", label: "My Clubs" },
  { href: "/createClub", label: "Create Club" },
  { href: "/clubAdmin", label: "Club Administration" },
];

const guestLinks = [
  { href: "/login", label: "Log in" },
  { href: "/signUp", label: "Sign up" },
];

const ChevronIcon = ({ open }) => (
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

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopClubOpen, setDesktopClubOpen] = useState(false);
  const [mobileClubOpen, setMobileClubOpen] = useState(false);
  const [desktopAccountOpen, setDesktopAccountOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const rawUser = localStorage.getItem("user");
      return rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
      console.error("Error parsing user:", error);
      return null;
    }
  });

  const clubBtnRef = useRef(null);
  const accountBtnRef = useRef(null);
  const router = useRouter();

  const displayName =
    currentUser?.username || currentUser?.email?.split("@")[0] || "Member";

  const closeDesktopMenus = () => {
    setDesktopClubOpen(false);
    setDesktopAccountOpen(false);
  };

  const closeMobileMenus = () => {
    setMobileClubOpen(false);
    setMobileAccountOpen(false);
    setMobileOpen(false);
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }

    setCurrentUser(null);
    closeDesktopMenus();
    closeMobileMenus();
    router.push("/");
  };

  return (
    <header className="border-b border-black/5 bg-white">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5" onClick={closeMobileMenus}>
            <span className="sr-only">HiveFinder</span>
            <Image
              src="/logo.png"
              alt="HiveFinder logo"
              width={128}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            aria-label="Open main menu"
            onClick={() => setMobileOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-600"
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

        <div className="hidden lg:flex lg:items-center lg:gap-x-12">
          {desktopLinks.map((item) => (
            <Link key={item.href} href={item.href} className={topLinkClass}>
              {item.label}
            </Link>
          ))}

          <div className="relative">
            <button
              ref={clubBtnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={desktopClubOpen}
              onClick={() => {
                setDesktopClubOpen((open) => !open);
                setDesktopAccountOpen(false);
              }}
              onBlur={() => {
                setTimeout(() => {
                  const button = clubBtnRef.current;
                  const menu = document.getElementById("desktop-menu-club");
                  const activeElement = document.activeElement;

                  if (
                    button &&
                    !button.contains(activeElement) &&
                    !menu?.contains(activeElement)
                  ) {
                    setDesktopClubOpen(false);
                  }
                }, 0);
              }}
              className={triggerClass}
            >
              Club
              <ChevronIcon open={desktopClubOpen} />
            </button>

            {desktopClubOpen && (
              <div
                id="desktop-menu-club"
                role="menu"
                aria-label="Club"
                tabIndex={-1}
                className={`${desktopDropdownClass} w-56`}
              >
                <div className="py-2">
                  {clubLinks
                    .filter((link) => !link.requiresAuth || currentUser)
                    .map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={desktopMenuItemClass}
                        onClick={closeDesktopMenus}
                      >
                        {link.label}
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              ref={accountBtnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={desktopAccountOpen}
              onClick={() => {
                setDesktopAccountOpen((open) => !open);
                setDesktopClubOpen(false);
              }}
              onBlur={() => {
                setTimeout(() => {
                  const button = accountBtnRef.current;
                  const menu = document.getElementById("desktop-menu-account");
                  const activeElement = document.activeElement;

                  if (
                    button &&
                    !button.contains(activeElement) &&
                    !menu?.contains(activeElement)
                  ) {
                    setDesktopAccountOpen(false);
                  }
                }, 0);
              }}
              className={triggerClass}
            >
              Account
              <ChevronIcon open={desktopAccountOpen} />
            </button>

            {desktopAccountOpen && (
              <div
                id="desktop-menu-account"
                role="menu"
                aria-label="Account"
                tabIndex={-1}
                className={`${desktopDropdownClass} w-64`}
              >
                <div className="py-2">
                  <p className={sectionLabelClass}>Account</p>
                  {currentUser
                    ? accountLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={desktopMenuItemClass}
                          onClick={closeDesktopMenus}
                        >
                          {link.label}
                        </Link>
                      ))
                    : guestLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={desktopMenuItemClass}
                          onClick={closeDesktopMenus}
                        >
                          {link.label}
                        </Link>
                      ))}

                  {currentUser && (
                    <>
                      <div className="my-2 border-t border-black/10" />
                      <div className="px-4 py-2">
                        <p className="text-sm font-semibold text-black">
                          Hi {displayName}!
                        </p>
                        <button
                          onClick={handleSignOut}
                          className="mt-1 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {currentUser ? (
            <span className="text-sm/6 font-semibold text-black">Hi {displayName}!</span>
          ) : null}
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/30"
            aria-hidden="true"
            onClick={closeMobileMenus}
          />

          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-black/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5" onClick={closeMobileMenus}>
                <span className="sr-only">HiveFinder</span>
                <Image
                  src="/logo.png"
                  alt="HiveFinder logo"
                  width={128}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>

              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMobileMenus}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
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
              <div className="-my-6 divide-y divide-black/10">
                <div className="space-y-2 py-6">
                  {desktopLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={mobileLinkClass}
                      onClick={closeMobileMenus}
                    >
                      {item.label}
                    </Link>
                  ))}

                  <div className="-mx-3">
                    <button
                      type="button"
                      aria-controls="mobile-club"
                      aria-expanded={mobileClubOpen}
                      onClick={() => setMobileClubOpen((open) => !open)}
                      className={mobileDisclosureButtonClass}
                    >
                      Club
                      <ChevronIcon open={mobileClubOpen} />
                    </button>

                    {mobileClubOpen && (
                      <div
                        id="mobile-club"
                        className="mt-2 space-y-1"
                        role="group"
                        aria-label="Club"
                      >
                        {clubLinks
                          .filter((link) => !link.requiresAuth || currentUser)
                          .map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={mobileMenuItemClass}
                              onClick={closeMobileMenus}
                            >
                              {link.label}
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="-mx-3">
                    <button
                      type="button"
                      aria-controls="mobile-account"
                      aria-expanded={mobileAccountOpen}
                      onClick={() => setMobileAccountOpen((open) => !open)}
                      className={mobileDisclosureButtonClass}
                    >
                      Account
                      <ChevronIcon open={mobileAccountOpen} />
                    </button>

                    {mobileAccountOpen && (
                      <div
                        id="mobile-account"
                        className="mt-2 space-y-1"
                        role="group"
                        aria-label="Account"
                      >
                        <p className={sectionLabelClass}>Account</p>

                        {currentUser
                          ? accountLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className={mobileMenuItemClass}
                                onClick={closeMobileMenus}
                              >
                                {link.label}
                              </Link>
                            ))
                          : guestLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className={mobileMenuItemClass}
                                onClick={closeMobileMenus}
                              >
                                {link.label}
                              </Link>
                            ))}

                        {currentUser && (
                          <>
                            <div className="my-2 border-t border-black/10" />
                            <div className="rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black">
                              Hi {displayName}!
                            </div>
                            <button
                              onClick={handleSignOut}
                              className={`${mobileMenuItemClass} w-full text-left text-red-600 hover:text-red-700`}
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
