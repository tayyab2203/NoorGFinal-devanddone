import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Product } from "@/lib/db/models";
import { success, error, isDbUnavailableError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-server";
import { auth } from "@/lib/auth";
import { PRODUCT_STATUS } from "@/lib/constants";
import { productCreateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { Product as ProductType } from "@/types";

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

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const ids = searchParams.getAll("id");
    const slug = searchParams.get("slug");
    const q = (searchParams.get("q") ?? "").trim();

    const session = await auth();
    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
    const filter = isAdmin ? {} : { status: PRODUCT_STATUS.ACTIVE };

    if (slug) {
      const product = await Product.findOne({ ...filter, slug }).lean();
      if (!product) return error("Not found", 404);
      return NextResponse.json(toProductJSON(product as Parameters<typeof toProductJSON>[0]));
    }

    if (ids.length > 0) {
      const { default: mongoose } = await import("mongoose");
      const objectIds = ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      const products = await Product.find({ _id: { $in: objectIds }, ...filter }).lean();
      return NextResponse.json(products.map((p) => toProductJSON(p as Parameters<typeof toProductJSON>[0])));
    }

    if (q) {
      const products = await Product.find({
        ...filter,
        $or: [
          { name: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ],
      }).lean();
      return NextResponse.json(products.map((p) => toProductJSON(p as Parameters<typeof toProductJSON>[0])));
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(products.map((p) => toProductJSON(p as Parameters<typeof toProductJSON>[0])));
  } catch (e) {
    console.error("[api/products] GET:", e);
    return error("Failed to fetch products", 500);
  }
}

export async function POST(request: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const body = await request.json();
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
        ? Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => `${k}: ${(v as string[])?.[0] ?? ""}`).join("; ")
        : "Validation failed";
      return error(msg, 400);
    }

    const data = parsed.data;
    let slug = data.slug?.trim() || slugify(data.name);
    let exists = await Product.findOne({ slug });
    let suffix = 0;
    while (exists) {
      suffix += 1;
      slug = `${slugify(data.name)}-${suffix}`;
      exists = await Product.findOne({ slug });
    }

    const product = await Product.create({
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      salePrice: data.salePrice ?? null,
      material: data.material,
      rating: data.rating,
      SKU: data.SKU,
      status: data.status,
      categoryId: data.categoryId,
      images: data.images,
      variants: data.variants,
    });

    const doc = product.toObject ? product.toObject() : product;
    return success(toProductJSON(doc as Parameters<typeof toProductJSON>[0]), 201);
  } catch (e) {
    console.error("[api/products] POST:", e);
    if (isDbUnavailableError(e)) return error("Database unavailable", 503);
    return error("Failed to create product", 500);
  }
}
