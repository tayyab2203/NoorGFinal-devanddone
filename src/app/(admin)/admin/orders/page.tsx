"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminOrders } from "@/lib/api/orders";
import { ADMIN_ROUTES, COLORS, ORDER_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { Eye, Filter } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  [ORDER_STATUS.PENDING]: "bg-gray-100 text-gray-700 border-gray-200",
  [ORDER_STATUS.CONFIRMED]: "bg-sky-100 text-sky-700 border-sky-200",
  [ORDER_STATUS.PROCESSING]: "bg-amber-100 text-amber-700 border-amber-200",
  [ORDER_STATUS.SHIPPED]: "bg-blue-100 text-blue-700 border-blue-200",
  [ORDER_STATUS.DELIVERED]: "bg-green-100 text-green-700 border-green-200",
  [ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-700 border-red-200",
  [ORDER_STATUS.REFUNDED]: "bg-gray-100 text-gray-600 border-gray-200",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...Object.values(ORDER_STATUS).map((s) => ({ value: s, label: s })),
];

export default function AdminOrdersPage() {
  const { data: orders = [], isLoading } = useAdminOrders();
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.orderStatus === filter);
  }, [orders, filter]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
          Orders
        </h1>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
        Orders
      </h1>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              filter === opt.value
                ? "border-[#C4A747] bg-[#C4A747]/10"
                : "border-[#ddd] hover:border-[#C4A747]/50"
            }`}
            style={{ color: filter === opt.value ? COLORS.goldAccent : COLORS.primaryDark }}
          >
            {opt.value !== "all" && <Filter className="h-3.5 w-3.5" />}
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#ddd] bg-white py-20 text-center text-[#333333]/70">
          No orders found
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#eee] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#eee] bg-[#F5F3EE]">
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Order
                  </th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Date
                  </th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Total
                  </th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Status
                  </th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-[#eee] hover:bg-[#F5F3EE]/50">
                    <td className="p-4 font-medium" style={{ color: COLORS.primaryDark }}>
                      {order.orderNumber}
                    </td>
                    <td className="p-4 text-[#333333]/70" suppressHydrationWarning>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="p-4 font-medium" style={{ color: COLORS.primaryDark }}>
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          STATUS_STYLES[order.orderStatus] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link
                        href={ADMIN_ROUTES.orderDetail(order.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd] px-3 py-1.5 text-sm font-medium transition hover:border-[#C4A747] hover:bg-[#F5F3EE]"
                        style={{ color: COLORS.primaryDark }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
