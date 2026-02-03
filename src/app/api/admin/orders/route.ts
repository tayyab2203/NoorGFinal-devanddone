import { connectDB } from "@/lib/db/mongodb";
import { Order } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-server";
import mongoose from "mongoose";
import type { OrderResponse } from "@/lib/api/orders";
import type { Order as OrderType } from "@/types";

function orderToResponse(doc: {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: { productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number; unitPrice: number }[];
  shippingAddress: Record<string, string>;
  paymentMethod: string;
  orderStatus: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  createdAt: Date;
}): OrderResponse {
  return {
    id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    userId: doc.userId.toString(),
    items: doc.items.map((i) => ({
      productId: i.productId.toString(),
      variantSKU: i.variantSKU,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    shippingAddress: {
      id: "",
      userId: doc.userId.toString(),
      ...doc.shippingAddress,
      isDefault: false,
    } as OrderType["shippingAddress"],
    paymentMethod: doc.paymentMethod,
    paymentStatus: doc.paymentStatus as OrderType["paymentStatus"],
    orderStatus: doc.orderStatus as OrderType["orderStatus"],
    subtotal: doc.subtotal,
    shippingFee: doc.shippingFee,
    totalAmount: doc.totalAmount,
    createdAt: doc.createdAt.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
  };
}

/** GET /api/admin/orders - list all orders (admin only) */
export async function GET(request: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean().exec();
    const response = orders.map((o) => orderToResponse(o as unknown as Parameters<typeof orderToResponse>[0]));
    return success(response);
  } catch (e) {
    console.error("[api/admin/orders] GET:", e);
    return error("Failed to fetch orders", 500);
  }
}
