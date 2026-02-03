import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { USER_ROLE } from "@/lib/constants";
import { NextResponse } from "next/server";

/**
 * Get session in a Route Handler or Server Component.
 * Uses auth() with no args so NextAuth reads from next/headers (current request).
 * Returns null if not authenticated.
 */
export async function getSession() {
  return auth();
}

/**
 * Require admin role. Use in API routes. Pass the request so the session cookie is read.
 * Returns NextResponse with 401 if not authenticated, 403 if not admin.
 * Returns null if authorized (caller should continue).
 */
export async function requireAdmin(request?: Request): Promise<NextResponse | null> {
  const raw = request
    ? await auth(request as unknown as Parameters<typeof auth>[0])
    : await auth();
  const session = raw as Session | null;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== USER_ROLE.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Require authenticated user. Use in API routes.
 * Returns NextResponse with 401 if not authenticated.
 * Returns null if authorized.
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
