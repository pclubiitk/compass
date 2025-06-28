"use client"

import Link from "next/link"
import { Home, MapPin, Star, User, Info } from "lucide-react"

export function MobileNavbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16">
        <Link href="#maps" className="flex flex-col items-center justify-center p-2">
          <MapPin className="w-5 h-5" />
          <span className="text-xs mt-1">Maps</span>
        </Link>
        
        <Link href="#reviews" className="flex flex-col items-center justify-center p-2">
          <Star className="w-5 h-5" />
          <span className="text-xs mt-1">Reviews</span>
        </Link>
        
        <Link href="#profile" className="flex flex-col items-center justify-center p-2">
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
        
        <Link href="#about" className="flex flex-col items-center justify-center p-2">
          <Info className="w-5 h-5" />
          <span className="text-xs mt-1">About</span>
        </Link>
      </div>
    </nav>
  )
}