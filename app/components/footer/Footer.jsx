import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        <div>
          <img src="/logo.png" alt="HiveFinder" className="h-8 w-auto" />
          <p className="mt-3 text-sm text-gray-600">
            Your one stop shop for clubs and friends at Sacramento State.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-black">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <a
                href="https://csus.campusgroups.com/home_login"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black"
              >
                Official clubs
              </a>
            </li>
            <li>
              <Link href="/friendFinder" className="hover:text-black">
                Friend Finder
              </Link>
            </li>
            <li>
              <Link href="/hives" className="hover:text-black">
                Browse hives
              </Link>
            </li>
            <li>
              <Link href="/createHive" className="hover:text-black">
                Start a hive
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-black">Need help?</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <a
                href="mailto:support@hivefinder.com"
                className="hover:text-black"
              >
                support@hivefinder.com
              </a>
            </li>
            <li>
              <Link href="/contact" className="hover:text-black">
                Contact us
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} HiveFinder
      </div>
    </footer>
  );
}
