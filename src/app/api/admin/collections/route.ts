import { connectDB } from "@/lib/db/mongodb";
import { Collection } from "@/lib/db/models";
import { successAdmin, error } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-server";
import { collectionCreateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import mongoose from "mongoose";

export interface AdminCollectionItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  productIds: string[];
  productCount: number;
}

function toItem(doc: {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  productIds?: mongoose.Types.ObjectId[];
}): AdminCollectionItem {
  const ids = (doc.productIds ?? []) as mongoose.Types.ObjectId[];
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    image: doc.image ?? "",
    displayOrder: doc.displayOrder ?? 0,
    productIds: ids.map((id) => id.toString()),
    productCount: ids.length,
  };
}

/** GET /api/admin/collections - list all collections (admin only) */
export async function GET(request: Request) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const collections = await Collection.find({}).sort({ displayOrder: 1 }).lean().exec();
    const list = collections.map((c) => toItem(c as unknown as Parameters<typeof toItem>[0]));
    return successAdmin(list);
  } catch (e) {
    console.error("[api/admin/collections] GET:", e);
    return error("Failed to fetch collections", 500);
  }
}

/** POST /api/admin/collections - create collection (admin only) */
export async function POST(request: Request) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const parsed = collectionCreateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? Object.values(parsed.error.flatten().fieldErrors).flat().join(", ")
      : "Invalid body";
    return error(msg, 400);
  }

  const data = parsed.data;
  let slug = data.slug?.trim() || slugify(data.name);
  try {
    await connectDB();
    let exists = await Collection.findOne({ slug });
    let suffix = 0;
    while (exists) {
      suffix += 1;
      slug = `${slugify(data.name)}-${suffix}`;
      exists = await Collection.findOne({ slug });
    }

    const productIds = (data.productIds ?? [])
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const collection = await Collection.create({
      name: data.name,
      slug,
      description: data.description ?? "",
      image: data.image ?? "",
      displayOrder: data.displayOrder ?? 0,
      productIds,
    });

    const doc = collection.toObject ? collection.toObject() : collection;
    const item = toItem({ ...doc, productIds: collection.productIds });
    return successAdmin(item);
  } catch (e) {
    console.error("[api/admin/collections] POST:", e);
    return error("Failed to create collection", 500);
  }
}
