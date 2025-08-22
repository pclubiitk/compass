import '../globals.css'
import  InstallPWA  from './components/InstallPWA'

export const metadata = {
  title: 'Next.js PWA',
  description: 'A Next.js PWA with App Router',
  manifest: '/manifest.json',
  themeColor: '#000000',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <main>
          {children}
           <InstallPWA />
        </main>
      </body>
    </html>
  )
}
