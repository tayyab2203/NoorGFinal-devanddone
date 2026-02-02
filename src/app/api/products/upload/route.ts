/**
 * Product image upload - uses Vercel Blob.
 * Prefer /api/upload for new code. Kept for backward compatibility.
 */
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth-server";
import { success, error } from "@/lib/api/response";

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
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const files = formData.getAll("files") as File[];

    const uploadFile = async (f: File) => {
      if (!f?.name || !f?.size) return null;
      if (!isAllowedType(f.type)) {
        throw new Error(`Invalid file type. Allowed: JPEG, PNG, GIF, WebP. Got: ${f.type}`);
      }
      return put(`products/${Date.now()}-${f.name}`, f, { access: "public" });
    };

    if (files.length > 0) {
      const urls: string[] = [];
      for (const f of files) {
        const blob = await uploadFile(f);
        if (blob) urls.push(blob.url);
      }
      return success({ urls });
    }

    if (file?.name && file?.size) {
      const blob = await uploadFile(file);
      if (blob) return success({ url: blob.url });
    }

    return error("No file or files provided", 400);
  } catch (e) {
    console.error("[api/products/upload] POST:", e);
    return error(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
