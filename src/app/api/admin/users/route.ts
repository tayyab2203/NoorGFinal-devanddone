import { connectDB } from "@/lib/db/mongodb";
import { User, Order } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-server";
import { USER_ROLE } from "@/lib/constants";
import mongoose from "mongoose";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  ordersCount: number;
  lastOrderDate: string | null;
}

/** GET /api/admin/users - list users (admin only, paginated) */
export async function GET(request: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const search = (searchParams.get("q") ?? "").trim().toLowerCase();

  try {
    await connectDB();
    const filter: { role?: string; $or?: { name: RegExp; email: RegExp }[] } = { role: USER_ROLE.CUSTOMER };
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
      User.countDocuments(filter),
    ]);

    const userIds = (users as { _id: mongoose.Types.ObjectId }[]).map((u) => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 }, lastDate: { $max: "$createdAt" } } },
    ]);
    const countMap = new Map(
      orderCounts.map((o) => [o._id.toString(), { count: o.count, lastDate: o.lastDate }])
    );

    const list: AdminUserItem[] = (users as { _id: mongoose.Types.ObjectId; name: string; email: string; image: string | null; role: string; createdAt: Date }[]).map((u) => {
      const info = countMap.get(u._id.toString());
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        createdAt: u.createdAt?.toISOString?.() ?? new Date(u.createdAt).toISOString(),
        ordersCount: info?.count ?? 0,
        lastOrderDate: info?.lastDate ? new Date(info.lastDate).toISOString() : null,
      };
    });

    return success({ users: list, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("[api/admin/users] GET:", e);
    return error("Failed to fetch users", 500);
  }
}
