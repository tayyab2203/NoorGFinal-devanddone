import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

function isSessionDecryptionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("decryption") ||
    message.includes("JWTSessionError") ||
    (err as { code?: string })?.code === "ERR_JWE_DECRYPTION_FAILED"
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    // Await params for Next.js 15+ compatibility (even if not used)
    await context.params;
    return await handlers.GET(request);
  } catch (err) {
    if (isSessionDecryptionError(err)) {
      return NextResponse.json({ user: null, expires: null });
    }
    // Log error for debugging but return JSON to avoid HTML error pages
    console.error("[NextAuth] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    // Await params for Next.js 15+ compatibility (even if not used)
    await context.params;
    return await handlers.POST(request);
  } catch (err) {
    // Log error for debugging but return JSON to avoid HTML error pages
    console.error("[NextAuth] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
