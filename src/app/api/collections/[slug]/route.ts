import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Collection, Product } from "@/lib/db/models";
import { PRODUCT_STATUS } from "@/lib/constants";
import type { Product as ProductType } from "@/types";

export interface CollectionWithProducts {
  collection: {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
    productCount: number;
  };
  products: ProductType[];
}

function toProductJSON(doc: { _id: { toString: () => string }; [k: string]: unknown }): ProductType {
  const o = doc as Record<string, unknown>;
  return {
    id: (o._id as { toString: () => string }).toString(),
    name: o.name as string,
    slug: o.slug as string,
    categoryId: (o.categoryId as string) ?? "",
    price: o.price as number,
    salePrice: (o.salePrice as number | null) ?? null,
    material: (o.material as string) ?? "",
    description: (o.description as string) ?? "",
    rating: (o.rating as number) ?? 0,
    SKU: o.SKU as string,
    status: (o.status as ProductType["status"]) ?? PRODUCT_STATUS.ACTIVE,
    images: (o.images as ProductType["images"]) ?? [],
    variants: (o.variants as ProductType["variants"]) ?? [],
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await context.params;
    const coll = await Collection.findOne({ slug }).lean();
    if (!coll) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const ids = (coll.productIds ?? []) as mongoose.Types.ObjectId[];
    const products = await Product.find({
      _id: { $in: ids },
      status: PRODUCT_STATUS.ACTIVE,
    }).lean();

    const payload: CollectionWithProducts = {
      collection: {
        id: (coll._id as mongoose.Types.ObjectId).toString(),
        name: coll.name,
        slug: coll.slug,
        description: coll.description ?? "",
        image: coll.image ?? "",
        productCount: products.length,
      },
      products: products.map((p) => toProductJSON(p as Parameters<typeof toProductJSON>[0])),
    };
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/collections/[slug]] GET:", e);
    const status = isDbUnavailableError(e) ? 503 : 500;
    const message = isDbUnavailableError(e) ? "Database unavailable" : "Failed to fetch collection";
    return NextResponse.json({ error: message }, { status });
  }
}
