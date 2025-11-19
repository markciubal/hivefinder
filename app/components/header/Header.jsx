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
                  {loggedIn ? (
                    <>
                      <a
                        href="/account"
                        className="block font-semibold text-black mb-2"
                      >
                        Edit Account Details
                      </a>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="block font-semibold text-black"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <a href="/login" className="block font-semibold text-black mb-2">Log In</a>
                      <a href="/signUp" className="block font-semibold text-black">Sign Up</a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
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
    </header>
  );
}
