import { connectDB } from "@/lib/db/mongodb";
import { User, Order } from "@/lib/db/models";
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

/** GET /api/admin/users/[id] - get user profile + orders (admin only) */
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
    const user = await User.findById(id).lean().exec();
    if (!user) return error("Not found", 404);

    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    const profile = {
      id: (user as { _id: mongoose.Types.ObjectId })._id.toString(),
      name: (user as { name: string }).name,
      email: (user as { email: string }).email,
      image: (user as { image: string | null }).image,
      role: (user as { role: string }).role,
      createdAt: (user as { createdAt: Date }).createdAt?.toISOString?.() ?? "",
    };
    const ordersList = orders.map((o) => orderToResponse(o as Parameters<typeof orderToResponse>[0]));
    return success({ user: profile, orders: ordersList });
  } catch (e) {
    console.error("[api/admin/users/[id]] GET:", e);
    return error("Failed to fetch user", 500);
  }
}
