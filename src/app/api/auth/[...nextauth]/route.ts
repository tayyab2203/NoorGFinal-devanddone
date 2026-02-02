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
  _context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    return await handlers.GET(request);
  } catch (err) {
    if (isSessionDecryptionError(err)) {
      return NextResponse.json({ user: null, expires: null });
    }
    throw err;
  }
}

export async function POST(
  request: NextRequest,
  _context: { params: Promise<{ nextauth: string[] }> }
) {
  return handlers.POST(request);
}
