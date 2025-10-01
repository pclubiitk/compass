import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { GlobalContextProvider } from "@/components/ContextProvider";
import { GlobalLoader } from "@/components/GlobalLoader";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { BottomNav } from "./components/BottomNavbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GlobalContextProvider>
            <main>
              <GlobalLoader />
              {children}
              <BottomNav />
            </main>
          </GlobalContextProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
