"use client";

import React, { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopProductOpen, setDesktopProductOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const productBtnRef = useRef(null);

  const { data: session } = useSession();
  const loggedIn = !!session?.user;

  return (
    <header className="bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">HiveFinder</span>
            <img src="logo.png" alt="Logo" className="h-8 w-auto" />
          </a>
        </div>

        {/* Desktop nav group */}
        <div className="hidden lg:flex lg:gap-x-12">
          <a href="/" className="text-sm/6 font-semibold text-black">Home</a>
          <a href="/clubPage" className="text-sm/6 font-semibold text-black">Club</a>
          <a href="/friendFinder" className="text-sm/6 font-semibold text-black">Friend Finder</a>

          {/* Account dropdown */}
          <div className="relative">
            <button
              ref={productBtnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={desktopProductOpen}
              onClick={() => setDesktopProductOpen((s) => !s)}
              onBlur={(e) => {
                setTimeout(() => {
                  if (
                    !e.currentTarget.contains(document.activeElement) &&
                    !document.getElementById("desktop-menu-product")?.contains(document.activeElement)
                  ) {
                    setDesktopProductOpen(false);
                  }
                }, 0);
              }}
              className="flex items-center gap-x-1 text-sm/6 font-semibold text-black"
            >
              Account
            </button>

            {desktopProductOpen && (
              <div
                id="desktop-menu-product"
                className="absolute z-50 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white outline outline-1 -outline-offset-1 outline-white/10"
              >
                <div className="p-4">
                  {/* Always show My Account */}
                  <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-white/5">
                    <a href="/account" className="block font-semibold text-black">
                      My Account
                    </a>
                  </div>

                  {/* Club Administration */}
                  <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-white/5">
                    <a href="#" className="block font-semibold text-black">
                      Club Administration
                    </a>
                  </div>

                  {/* Conditional: login/sign up OR logout */}
                  {loggedIn ? (
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block font-semibold text-black w-full text-left mt-2"
                    >
                      Logout
                    </button>
                  ) : (
                    <>
                      <a href="/login" className="block font-semibold text-black mt-2">Log In</a>
                      <a href="/signUp" className="block font-semibold text-black">Sign Up</a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side login/logout */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {loggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm/6 font-semibold text-black"
            >
              Logout
            </button>
          ) : (
            <a href="/login" className="text-sm/6 font-semibold text-black">Log in →</a>
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
              <a href="/" className="-m-1.5 p-1.5">
                <span className="sr-only">HiveFinder</span>
                <img src="logo.png" alt="Logo" className="h-8 w-auto" />
              </a>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-300 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" className="size-6">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-white/10">
                <div className="space-y-2 py-6">
                  <a href="/" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-white/5">Home</a>
                  <a href="/clubPage" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-white/5">Club</a>
                  <a href="/friendFinder" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-white/5">Friend Finder</a>

                  {/* Mobile Account accordion */}
                  <div className="-mx-3">
                    <button
                      type="button"
                      aria-controls="mobile-products"
                      aria-expanded={mobileProductsOpen}
                      onClick={() => setMobileProductsOpen((s) => !s)}
                      className="flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base font-semibold text-black hover:bg-white/5"
                    >
                      Account
                      <svg
                        viewBox="0 0 20 20"
                        fill="black"
                        aria-hidden="true"
                        className={`size-5 flex-none transition-transform ${mobileProductsOpen ? "rotate-180" : ""}`}
                      >
                        <path d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" fillRule="evenodd" />
                      </svg>
                    </button>

                    {mobileProductsOpen && (
                      <div id="mobile-products" className="mt-2 space-y-2" role="group" aria-label="Account">
                        <a href="/account" className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5">My Account</a>
                        <a href="#" className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5">Club Administration</a>
                        {loggedIn ? (
                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5 w-full text-left"
                          >
                            Logout
                          </button>
                        ) : (
                          <a href="/login" className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5">Log In</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
