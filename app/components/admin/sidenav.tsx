// import Link from 'next/link';
import NavLinks from '@/app/components/admin/nav-links';
import { PowerIcon } from '@heroicons/react/24/outline';
// import { signOut } from '@/auth';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <div>
          <NavLinks />
        </div>
        <form
          action={async () => {
            'use server';
            // await signOut({ redirectTo: '/' });
          }}
        >
          <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
            <PowerIcon className="w-6" />
            <div className="hidden md:block font-semibold text-gray-900 placeholder:text-gray-400">Log Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}
