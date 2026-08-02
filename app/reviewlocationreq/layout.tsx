import AdminGuard from "../../components/AdminGuard";

export default function ReviewLocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminGuard>{children}</AdminGuard>;
}
