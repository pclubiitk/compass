import "@/app/globals.css";
// TODO: combine the two components folders
import { BottomNav } from "@/components/BottomNavbar";

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
