import { NextResponse } from "next/server";

/** Success response: { data } */
export function success<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/** Admin success: same as success but with Cache-Control: private, no-store for fresh data. */
export function successAdmin<T>(data: T, status = 200): NextResponse {
  const res = NextResponse.json({ data }, { status });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

/** Error response: { error: message } */
export function error(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** True if the error indicates DB is not configured or unavailable (for returning 503). */
export function isDbUnavailableError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("not set") ||
    msg.includes("MONGODB_URI") ||
    msg.includes("DATABASE_URL") ||
    msg.includes("connect ECONNREFUSED") ||
    msg.includes("connection refused")
  );
}
