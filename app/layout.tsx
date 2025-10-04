import { Toaster } from "@/components/ui/sonner";
import "@/app/globals.css";
import { GlobalContextProvider } from "@/components/ContextProvider";
import { GlobalLoader } from "@/components/GlobalLoader";
import { ThemeProvider } from "@/components/theme-provider";
// TODO: combine the two components folders

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
            </main>
          </GlobalContextProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
