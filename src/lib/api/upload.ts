import { apiClient } from "./client";
import { unwrapData } from "./types";
import { getApiErrorMessage } from "./types";

/** Accepted image types for upload (including webp) */
export const ACCEPT_IMAGE_TYPES = "image/jpeg,image/jpg,image/png,image/gif,image/webp";

/** Upload an image via Vercel Blob. Requires admin auth. */
export async function uploadImage(
  file: File,
  prefix: "products" | "categories" | "uploads" = "uploads"
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("prefix", prefix);

  const res = await apiClient.post<
    { data?: { url: string } } | { url: string }
  >("/api/upload", form);

  const data = unwrapData(res.data, { url: "" });
  const url =
    typeof data === "object" && data && "url" in data
      ? (data as { url: string }).url
      : "";

  if (!url) throw new Error("Upload failed");
  return { url };
}

/** Get user-friendly error message for upload failures */
export function getUploadErrorMessage(err: unknown): string {
  return getApiErrorMessage(err);
}
