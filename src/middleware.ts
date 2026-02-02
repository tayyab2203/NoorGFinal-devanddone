import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  // auth() runs the authorized callback from auth config;
  // /account and /admin are already protected there.
  // Pass pathname to layout via header for login page detection
  const response = NextResponse.next();
  response.headers.set("x-pathname", req.nextUrl.pathname);
  return response;
});

export const config = {
  // Protect /account and /admin (and all subpaths); /admin requires ADMIN role (see authorized callback in auth)
  // Note: /admin/login is allowed without auth (handled in authorized callback)
  matcher: ["/account", "/account/:path*", "/admin", "/admin/:path*"],
};
