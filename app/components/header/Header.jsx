"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopProductOpen, setDesktopProductOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const productBtnRef = useRef(null);

  return (
    <header className="bg-white">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Your Company</span>
           <img 
             src="logo.png"
             alt=""
             className="h-8 w-auto"
           />
          </a>
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
          <a href="/" className="text-sm/6 font-semibold text-black">
            Home
          </a>
          <a href="/clubPage" className="text-sm/6 font-semibold text-black">
            Club
          </a>
          <a href="/friendFinder" className="text-sm/6 font-semibold text-black">
            Friend Finder
          </a>
          {/* Desktop Product popover */}
          <div className="relative">
            <button
              ref={productBtnRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={desktopProductOpen}
              onClick={() => setDesktopProductOpen((s) => !s)}
              onBlur={(e) => {
                // close when focus leaves the button + panel
                // delay to allow clicks within panel
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
                id="desktop-menu-product"
                role="menu"
                aria-label="Product"
                tabIndex={-1}
                className="absolute z-50 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white outline outline-1 -outline-offset-1 outline-white/10 backdrop:bg-transparent"
              >
                <div className="p-4">
                  {/* Item */}
                  <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-white/5">
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-200/50 group-hover:bg-gray-700">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                        className="size-6 text-gray-400 group-hover:text-black"
                      >
                        <path
                          d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-auto">
                      <a href="/account" className="block font-semibold text-black">
                        My Account
                        <span className="absolute inset-0" />
                      </a>
                      <p className="mt-1 text-gray-400">
                        Speak directly to your customers
                      </p>
                    </div>
                  </div>

                  {/* Item */}
                  <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-white/5">
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-200/50 group-hover:bg-gray-700">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                        className="size-6 text-gray-400 group-hover:text-black"
                      >
                        <path
                          d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-auto">
                      <a href="#" className="block font-semibold text-black">
                        Club Administration
                        <span className="absolute inset-0" />
                      </a>
                      <p className="mt-1 text-gray-400">
                        Manage your clubs here.
                      </p>
                    </div>
                  </div>
                  {/* Item */}
                  <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-white/5">
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-200/50 group-hover:bg-gray-700">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                        className="size-6 text-gray-400 group-hover:text-black"
                      >
                        <path
                          d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-auto">
                      <a href="/login" className="block font-semibold text-black">
                        Log In
                        <span className="absolute inset-0" />
                      </a>
                      <p className="mt-1 text-gray-400">
                        Speak directly to your customers
                      </p>
                    </div>
                  </div>
                  {/* Item */}
                  <div className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-white/5">
                    <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-200/50 group-hover:bg-gray-700">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                        className="size-6 text-gray-400 group-hover:text-black"
                      >
                        <path
                          d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-auto">
                      <a href="/signUp" className="block font-semibold text-black">
                        Sign Up
                        <span className="absolute inset-0" />
                      </a>
                      <p className="mt-1 text-gray-400">
                        Create an account
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <a href="/login" className="text-sm/6 font-semibold text-black">
            Log in <span aria-hidden="true">→</span>
          </a>
        </div>
      </nav>

     {/* Mobile menu "dialog" */}
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
              <img
                src="logo.png"
                alt="Logo"
                className="h-8 w-auto"
              />
            </a>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-300 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
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
            <div className="-my-6 divide-y divide-white/10">
              <div className="space-y-2 py-6">
                {/* Account accordion (matches desktop dropdown) */}
                                    <a
                      href="/"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-white/5"
                    >
                      Home
                    </a>
                    <a
                      href="/clubPage"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-white/5"
                    >
                      Club
                    </a>
                    
                      <a
                        href="/friendFinder"
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-white/5"
                      >
                        Friend Finder
                      </a>
                <div className="-mx-3">
                  <button
                    type="button"
                    aria-controls="mobile-products"
                    aria-expanded={mobileProductsOpen}
                    onClick={() => setMobileProductsOpen((s) => !s)}
                    className="flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base font-semibold text-black hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Account
                    <svg
                      viewBox="0 0 20 20"
                      fill="black"
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
                      id="mobile-products"
                      className="mt-2 space-y-2"
                      role="group"
                      aria-label="Account"
                    >
                      <a
                        href="/account"
                        className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5"
                      >
                        My Account
                      </a>

                      <a
                        href="#"
                        className="block rounded-lg py-2 pr-3 pl-6 text-sm font-semibold text-black hover:bg-white/5"
                      >
                        Club Administration
                      </a>
                    </div>
                  )}
                </div>
                 <a
                  href="#"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-black hover:bg-white/5"
                >
                  Log in
                </a>
              </div>

              <div className="py-6">
               
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    </header>
  );
}