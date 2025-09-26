import { Metadata } from "next";
import { ThemeProvider } from "next-themes";

export const metadata = {
  title: "Campus Notice Board",
  description: "Live updates from campus",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div id="noticeboard" className={`antialiased relative min-h-screen`}>
        <div className="relative z-0">{children}</div>
      </div>
    </ThemeProvider>
  );
}
