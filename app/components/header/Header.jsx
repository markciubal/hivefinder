'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const accountBtnRef = useRef(null);

  return (
    <header className="bg-white sticky top-0 z-[1000]">
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">HiveFinder</span>
            <img src="/logo.png" alt="HiveFinder" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open main menu"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-500"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6">
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-12">
          <Link href="/" className="text-sm font-semibold text-black">Home</Link>
          <Link href="/clubPage" className="text-sm font-semibold text-black">Club</Link>
          <Link href="/friendFinder" className="text-sm font-semibold text-black">Friend Finder</Link>

          <div className="relative">
            <button
              ref={accountBtnRef}
              type="button"
              onClick={() => setAccountOpen(s => !s)}
              className="flex items-center gap-x-1 text-sm font-semibold text-black"
            >
              Account
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {accountOpen && (
              <div className="absolute right-0 mt-3 w-40 rounded-lg bg-white shadow ring-1 ring-gray-200 z-50">
                <div className="p-2">
                  <Link href="/login" className="block rounded px-3 py-2 text-sm font-semibold text-black hover:bg-gray-50">
                    Log in
                  </Link>
                  <Link href="/signUp" className="block rounded px-3 py-2 text-sm font-semibold text-black hover:bg-gray-50">
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link href="/login" className="text-sm font-semibold text-black">Log in →</Link>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full bg-white p-6 sm:max-w-sm shadow-xl">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5">
                <img src="/logo.png" alt="HiveFinder" className="h-8 w-auto" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-500"
                aria-label="Close menu"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <Link href="/" className="block text-base font-semibold text-black">Home</Link>
              <Link href="/clubPage" className="block text-base font-semibold text-black">Club</Link>
              <Link href="/friendFinder" className="block text-base font-semibold text-black">Friend Finder</Link>

              <button
                type="button"
                onClick={() => setMobileAccountOpen(s => !s)}
                className="flex w-full items-center justify-between text-base font-semibold text-black"
              >
                Account
                <svg viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transform transition ${mobileAccountOpen ? 'rotate-180' : ''}`}>
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {mobileAccountOpen && (
                <div className="pl-3 space-y-2">
                  <Link href="/login" className="block text-base font-semibold text-black">Log in</Link>
                  <Link href="/signUp" className="block text-base font-semibold text-black">Sign up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
