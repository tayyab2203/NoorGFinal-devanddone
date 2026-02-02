import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { USER_ROLE } from "@/lib/constants";
import AdminLayoutClient from "./AdminLayoutClient";

/**
 * Admin layout: server-side gate. Only users with role ADMIN can access.
 * Middleware already protects /admin; this adds a server check so non-admins are redirected even if they bypass client.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Get current pathname to allow /admin/login without auth
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  
  // Allow access to admin login page without authentication
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }
  const role = (session.user as { role?: string }).role;
  if (role !== USER_ROLE.ADMIN) {
    redirect("/admin/login");
  }
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
