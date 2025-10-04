import "@/app/globals.css";
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
