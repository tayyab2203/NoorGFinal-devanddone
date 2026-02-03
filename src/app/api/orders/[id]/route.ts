import { connectDB } from "@/lib/db/mongodb";
import { Order } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { getSession, requireAuth } from "@/lib/auth-server";
import { requireAdmin } from "@/lib/auth-server";
import { USER_ROLE, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import mongoose from "mongoose";
import { z } from "zod";

const orderUpdateSchema = z.object({
  orderStatus: z.enum(Object.values(ORDER_STATUS) as [string, ...string[]]).optional(),
  paymentStatus: z.enum(Object.values(PAYMENT_STATUS) as [string, ...string[]]).optional(),
});
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

/** GET /api/orders/[id] - get single order (auth required; owner or admin) */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;
  if (!userId) return error("Unauthorized", 401);

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return error("Invalid order id", 400);

  try {
    await connectDB();
    const order = await Order.findById(id).lean().exec();
    if (!order) return error("Order not found", 404);

    const orderDoc = order as unknown as { userId: mongoose.Types.ObjectId | string };
    const orderUserId = (orderDoc.userId as mongoose.Types.ObjectId)?.toString?.() ?? (orderDoc.userId as string);
    if (orderUserId !== userId && role !== USER_ROLE.ADMIN) return error("Forbidden", 403);

    const response = orderToResponse(order as unknown as Parameters<typeof orderToResponse>[0]);
    return success(response);
  } catch (e) {
    console.error("[api/orders/[id]] GET:", e);
    return error("Failed to fetch order", 500);
  }
}

/** PATCH /api/orders/[id] - update order (admin only: orderStatus, paymentStatus) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return error("Invalid order id", 400);

  const body = await request.json().catch(() => ({}));
  const parsed = orderUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.flatten().fieldErrors ? Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") : "Invalid body", 400);
  }
  const { orderStatus, paymentStatus } = parsed.data;

  try {
    await connectDB();
    const order = await Order.findByIdAndUpdate(
      id,
      { ...(orderStatus != null && { orderStatus }), ...(paymentStatus != null && { paymentStatus }) },
      { new: true }
    ).lean();
    if (!order) return error("Order not found", 404);
    const response = orderToResponse(order as unknown as Parameters<typeof orderToResponse>[0]);
    return success(response);
  } catch (e) {
    console.error("[api/orders/[id]] PATCH:", e);
    return error("Failed to update order", 500);
  }
}
