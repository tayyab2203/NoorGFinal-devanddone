import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth-server";
import { success, error } from "@/lib/api/response";

/** Allowed MIME types for image uploads (including webp) */
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

function isAllowedType(type: string): boolean {
  return ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number]);
}

export async function POST(request: Request) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const files = formData.getAll("files") as File[];
    const prefix = (formData.get("prefix") as string) || "uploads";

    const uploadFile = async (f: File): Promise<string> => {
      if (!f?.name || !f?.size) {
        throw new Error("Invalid file");
      }
      if (!isAllowedType(f.type)) {
        throw new Error(
          `Invalid file type. Allowed: JPEG, PNG, GIF, WebP. Got: ${f.type}`
        );
      }
      const blob = await put(`${prefix}/${Date.now()}-${f.name}`, f, {
        access: "public",
      });
      return blob.url;
    };

    if (files.length > 0) {
      const urls: string[] = [];
      for (const f of files) {
        try {
          const url = await uploadFile(f);
          urls.push(url);
        } catch (e) {
          console.warn("[api/upload] Skip file:", f.name, e);
        }
      }
      return success({ urls });
    }

    if (file?.name && file?.size) {
      const url = await uploadFile(file);
      return success({ url });
    }

    return error("No file or files provided", 400);
  } catch (e) {
    console.error("[api/upload] POST:", e);
    return error(
      e instanceof Error ? e.message : "Upload failed",
      500
    );
  }
}
