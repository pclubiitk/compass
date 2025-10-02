import { Toaster } from "@/components/ui/sonner";
import "@/app/globals.css";
import { GlobalContextProvider } from "@/components/ContextProvider";
import { GlobalLoader } from "@/components/GlobalLoader";
import { ThemeProvider } from "@/components/ui/theme-provider";
// TODO: combine the two components folders
import { BottomNav } from "@/app/components/BottomNavbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
