import { Toaster } from "@/components/ui/sonner";
import "@/app/globals.css";
import { GlobalContextProvider } from "@/components/ContextProvider";
import { GlobalLoader } from "@/components/GlobalLoader";
import { ThemeProvider } from "@/components/theme-provider";
import SWRProvider from "./SWRProvider";
import type { Metadata, Viewport } from "next";
import InstallPWA from "@/components/profile/InstallPWA";
import InstallPWASafari from "@/components/profile/SafariPWAPopup";

export const metadata: Metadata = {
  title: "Student Search and Compass",
  description: "A web application for IITK students to manage their academic and personal life.",
  manifest: "/manifest.json",
};  

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SWRProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <GlobalContextProvider>
              <main>
                <GlobalLoader />
                {children}
                <InstallPWA />
                <InstallPWASafari />
              </main>
            </GlobalContextProvider>
          </ThemeProvider>
          <Toaster />
          
        </SWRProvider>
      </body>
    </html>
  );
}
