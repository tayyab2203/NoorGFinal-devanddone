import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ADMIN_SECURITY_HEADERS: [string, string][] = [
  ["X-Frame-Options", "DENY"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
];

export default auth((req) => {
  // auth() runs the authorized callback from auth config;
  // /account and /admin are already protected there.
  const response = NextResponse.next();
  response.headers.set("x-pathname", req.nextUrl.pathname);

  // Lock down admin with security headers (no embedding, no sniffing)
  if (req.nextUrl.pathname.startsWith("/admin")) {
    ADMIN_SECURITY_HEADERS.forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
});

export const config = {
  // Protect /account and /admin (and all subpaths); /admin requires ADMIN role (see authorized callback in auth)
  // Note: /admin/login is allowed without auth (handled in authorized callback)
  matcher: ["/account", "/account/:path*", "/admin", "/admin/:path*"],
};
