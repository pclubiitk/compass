'use client';

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink
} from '@/components/ui/navigation-menu';
import Link from 'next/link';

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 w-full bg-white border-t shadow z-50">
      <NavigationMenu className="w-full justify-around p-2">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
                <Link href="/">Home</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
                <Link href="/profile">Profile</Link>    
            </NavigationMenuLink>       
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
                <Link href="/share">Share</Link>    
            </NavigationMenuLink>          
          </NavigationMenuItem>
      </NavigationMenu>
    </div>
  );
}
