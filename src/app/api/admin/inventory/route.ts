import { connectDB } from "@/lib/db/mongodb";
import { Product } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-server";
import { PRODUCT_STATUS } from "@/lib/constants";
import mongoose from "mongoose";

export interface InventoryVariantItem {
  productId: string;
  productName: string;
  productStatus: string;
  variantSKU: string;
  size: string;
  color: string;
  stock: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

/** GET /api/admin/inventory - list all products with variant stock (admin only) */
export async function GET(request: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const filterType = searchParams.get("filter") ?? "all"; // all | low_stock | out_of_stock

  try {
    await connectDB();
    const products = await Product.find({}).sort({ name: 1 }).lean().exec();

    const rows: InventoryVariantItem[] = [];
    type ProductDoc = { _id: mongoose.Types.ObjectId; name: string; status: string; variants: { size: string; color: string; stock: number; variantSKU: string }[] };
    for (const p of products as unknown as ProductDoc[]) {
      for (const v of p.variants ?? []) {
        const status: "in_stock" | "low_stock" | "out_of_stock" =
          v.stock === 0 ? "out_of_stock" : v.stock < 5 ? "low_stock" : "in_stock";
        if (filterType === "low_stock" && status !== "low_stock") continue;
        if (filterType === "out_of_stock" && status !== "out_of_stock") continue;
        rows.push({
          productId: p._id.toString(),
          productName: p.name,
          productStatus: p.status ?? PRODUCT_STATUS.ACTIVE,
          variantSKU: v.variantSKU,
          size: v.size,
          color: v.color,
          stock: v.stock,
          status,
        });
      }
    }

    return success(rows);
  } catch (e) {
    console.error("[api/admin/inventory] GET:", e);
    return error("Failed to fetch inventory", 500);
  }
}
