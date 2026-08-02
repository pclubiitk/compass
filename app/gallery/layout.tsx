import AdminGuard from "../../components/AdminGuard";

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminGuard>{children}</AdminGuard>;
}
