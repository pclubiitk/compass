import { ThemeProvider } from "next-themes";
import { FeatureGuard } from "@/components/FeatureGuard";
export const metadata = {
  title: "Campus Notice Board",
  description: "Live updates from campus",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <FeatureGuard feature="noticeboard">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div id="noticeboard" className={`antialiased relative min-h-screen`}>
          <div className="relative z-0">{children}</div>
        </div>
      </ThemeProvider>
    </FeatureGuard>
  );
}
