import type { AxiosError } from "axios";

/** Standard API error response */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
  details?: unknown;
}

/** Wrapper for paginated list responses */
export interface ApiPaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/** Generic success response */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
}

/** Type guard for API error from Axios */
export function isApiError(err: unknown): err is AxiosError<ApiErrorResponse> {
  return (
    typeof err === "object" &&
    err !== null &&
    "isAxiosError" in err &&
    (err as AxiosError).isAxiosError === true
  );
}

/** Extract user-facing error message from an error */
export function getApiErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    const data = err.response?.data as ApiErrorResponse | undefined;
    return data?.message ?? data?.error ?? err.message ?? "An error occurred";
  }
  if (err instanceof Error) return err.message;
  return "An error occurred";
}

/** Unwrap API response body: { data: T } or raw T */
export function unwrapData<T>(body: unknown, fallback: T): T {
  if (body != null && typeof body === "object" && "data" in body && (body as { data?: T }).data !== undefined) {
    return (body as { data: T }).data;
  }
  return (body as T) ?? fallback;
}
