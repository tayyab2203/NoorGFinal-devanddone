import { connectDB } from "@/lib/db/mongodb";
import { Order, Payment } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { getSession, requireAuth } from "@/lib/auth-server";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import mongoose from "mongoose";
import { z } from "zod";

const confirmBodySchema = z.object({
  orderId: z.string().min(1, "orderId required"),
});

/** POST /api/payments/confirm - mock: set payment and order as PAID (auth required) */
export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return error("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = confirmBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.orderId?.[0] ?? "Invalid body";
    return error(msg, 400);
  }
  const { orderId } = parsed.data;

  if (!mongoose.Types.ObjectId.isValid(orderId)) return error("Invalid order id", 400);

  try {
    await connectDB();
    const order = await Order.findById(orderId).exec();
    if (!order) return error("Order not found", 404);
    if (order.userId.toString() !== userId) return error("Forbidden", 403);

    const payment = await Payment.findOne({ orderId: order._id }).exec();
    if (!payment) return error("Payment not found", 404);

    payment.status = "PAID";
    await payment.save();

    order.paymentStatus = PAYMENT_STATUS.PAID;
    order.orderStatus = ORDER_STATUS.CONFIRMED;
    await order.save();

    return success({ confirmed: true, orderId });
  } catch (e) {
    console.error("[api/payments/confirm] POST:", e);
    return error("Failed to confirm payment", 500);
  }
}
