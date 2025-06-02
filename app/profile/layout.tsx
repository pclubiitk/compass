import '../globals.css'
import  InstallPWA  from './components/InstallPWA'
import { MobileNavbar } from './components/MobileNavBar'


export const metadata = {
  title: 'Next.js PWA',
  description: 'A Next.js PWA with App Router',
  manifest: '/manifest.json',
  themeColor: '#000000',
}

// Define the props type
interface RootLayoutProps {
  children: React.ReactNode
}

// export default function RootLayout({ children }: RootLayoutProps) {
//   return (
//     <html lang="en">
//       <head>
//         <link rel="manifest" href="/manifest.json" />
//         <meta name="theme-color" content="#000000" />
//         <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
//         <meta name="apple-mobile-web-app-capable" content="yes" />
//         <meta name="apple-mobile-web-app-status-bar-style" content="black" />
//       </head>
//       <body>
//         {children}
//         <InstallPWA />
//       </body>
//     </html>
//   )
// }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <main className="px-4 py-6 text-base md:text-lg">
          {children}
            <MobileNavbar />
           <InstallPWA />
        </main>
      </body>
    </html>
  )
}
