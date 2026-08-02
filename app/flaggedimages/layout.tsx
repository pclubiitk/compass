import AdminGuard from "@/components/AdminGuard";

export default function FlaggedImagesLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
