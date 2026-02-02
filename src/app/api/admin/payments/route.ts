import { connectDB } from "@/lib/db/mongodb";
import { Payment, Order } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-server";
import mongoose from "mongoose";

export interface AdminPaymentItem {
  id: string;
  orderId: string;
  orderNumber: string;
  method: string;
  status: string;
  referenceNumber: string;
  amount: number;
  createdAt: string;
}

/** GET /api/admin/payments - list all payments (admin only) */
export async function GET(request: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const method = searchParams.get("method") ?? "";
  const status = searchParams.get("status") ?? "";

  try {
    await connectDB();
    const filter: { method?: string; status?: string } = {};
    if (method) filter.method = method;
    if (status) filter.status = status;

    const payments = await Payment.find(filter).sort({ createdAt: -1 }).limit(200).lean().exec();
    const orderIds = [...new Set((payments as { orderId: mongoose.Types.ObjectId }[]).map((p) => p.orderId))];
    const orders = await Order.find({ _id: { $in: orderIds } }).select("orderNumber totalAmount").lean().exec();
    const orderMap = new Map(
      (orders as { _id: mongoose.Types.ObjectId; orderNumber: string; totalAmount: number }[]).map((o) => [
        o._id.toString(),
        { orderNumber: o.orderNumber, totalAmount: o.totalAmount },
      ])
    );

    const list: AdminPaymentItem[] = (payments as {
      _id: mongoose.Types.ObjectId;
      orderId: mongoose.Types.ObjectId;
      method: string;
      status: string;
      referenceNumber: string;
      createdAt: Date;
    }[]).map((p) => {
      const o = orderMap.get(p.orderId.toString());
      return {
        id: p._id.toString(),
        orderId: p.orderId.toString(),
        orderNumber: o?.orderNumber ?? "",
        method: p.method,
        status: p.status,
        referenceNumber: p.referenceNumber ?? "",
        amount: o?.totalAmount ?? 0,
        createdAt: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
      };
    });

    return success(list);
  } catch (e) {
    console.error("[api/admin/payments] GET:", e);
    return error("Failed to fetch payments", 500);
  }
}
