export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Navigation and sidebar are provided by the parent (user) layout.
  // This layout only wraps page content to avoid duplicate sidebars/nav.
  return <>{children}</>;
}
