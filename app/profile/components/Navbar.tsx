"use client"

import Link from "next/link"

export function Navbar() {
  return (
    <header className="w-full border-b bg-white dark:bg-gray-950 sticky top-0 z-50">
      <div className="container mx-auto px-2 py-1">
        <div className="flex items-center justify-between">
          {/* Logo/Heading */}
          <Link href="/" className="text-xl font-bold">
            Maps
          </Link>
          <Link href="/" className="text-xl font-bold">
            Reviews
          </Link>
          <Link href="/" className="text-xl font-bold">
            Profile
          </Link>
          <Link href="/" className="text-xl font-bold">
            Share
          </Link>

          {/* Optional: Add menu button for mobile */}
          <button className="sm:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}