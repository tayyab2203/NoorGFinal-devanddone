import { connectDB } from "@/lib/db/mongodb";
import { Collection } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-server";
import { collectionUpdateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import mongoose from "mongoose";

type CollectionDoc = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  productIds?: mongoose.Types.ObjectId[];
};

/** GET /api/admin/collections/[id] - get one collection (admin only) */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return error("Invalid id", 400);

  try {
    await connectDB();
    const collection = await Collection.findById(id).lean().exec();
    if (!collection) return error("Not found", 404);

    const doc = collection as unknown as CollectionDoc;
    const productIds = (doc.productIds ?? []).map((id) => id.toString());
    return success({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description ?? "",
      image: doc.image ?? "",
      displayOrder: doc.displayOrder ?? 0,
      productIds,
      productCount: productIds.length,
    });
  } catch (e) {
    console.error("[api/admin/collections/[id]] GET:", e);
    return error("Failed to fetch collection", 500);
  }
}

/** PATCH /api/admin/collections/[id] - update collection (admin only) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return error("Invalid id", 400);

  const body = await request.json().catch(() => ({}));
  const parsed = collectionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
      : "Invalid body";
    return error(msg, 400);
  }

  const data = parsed.data;
  try {
    await connectDB();
    if (data.slug !== undefined) {
      const existing = await Collection.findOne({
        slug: data.slug,
        _id: { $ne: new mongoose.Types.ObjectId(id) },
      });
      if (existing) return error("Slug already in use", 400);
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.image !== undefined) updatePayload.image = data.image;
    if (data.displayOrder !== undefined) updatePayload.displayOrder = data.displayOrder;
    if (data.productIds !== undefined) {
      updatePayload.productIds = data.productIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    const collection = await Collection.findByIdAndUpdate(id, { $set: updatePayload }, { new: true }).lean().exec();
    if (!collection) return error("Not found", 404);

    const doc = collection as unknown as CollectionDoc;
    const productIds = (doc.productIds ?? []).map((id) => id.toString());
    return success({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description ?? "",
      image: doc.image ?? "",
      displayOrder: doc.displayOrder ?? 0,
      productIds,
      productCount: productIds.length,
    });
  } catch (e) {
    console.error("[api/admin/collections/[id]] PATCH:", e);
    return error("Failed to update collection", 500);
  }
}

/** DELETE /api/admin/collections/[id] - delete collection (admin only) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return error("Invalid id", 400);

  try {
    await connectDB();
    const collection = await Collection.findByIdAndDelete(id);
    if (!collection) return error("Not found", 404);
    return success({ deleted: true });
  } catch (e) {
    console.error("[api/admin/collections/[id]] DELETE:", e);
    return error("Failed to delete collection", 500);
  }
}
