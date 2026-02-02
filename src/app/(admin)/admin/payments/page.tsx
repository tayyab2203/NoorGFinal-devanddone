"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminPayments } from "@/lib/api/admin";
import { ADMIN_ROUTES, COLORS, PAYMENT_METHOD, PAYMENT_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { Filter } from "lucide-react";

export default function AdminPaymentsPage() {
  const [method, setMethod] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const { data: payments = [], isLoading } = useAdminPayments(
    method ? { method } : status ? { status } : undefined
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>Payments</h1>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>Payments</h1>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#333333]/60" />
          <span className="text-sm font-medium text-[#333333]/70">Method:</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-lg border border-[#ddd] px-3 py-1.5 text-sm">
            <option value="">All</option>
            {Object.values(PAYMENT_METHOD).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#333333]/70">Status:</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[#ddd] px-3 py-1.5 text-sm">
            <option value="">All</option>
            {Object.values(PAYMENT_STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#ddd] bg-white py-20 text-center text-[#333333]/70">No payments found</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#eee] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#eee] bg-[#F5F3EE]">
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Order</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Method</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Amount</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Status</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Reference</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Date</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[#eee] hover:bg-[#F5F3EE]/50">
                    <td className="p-4 font-medium" style={{ color: COLORS.primaryDark }}>{p.orderNumber}</td>
                    <td className="p-4">{p.method}</td>
                    <td className="p-4">{formatPrice(p.amount)}</td>
                    <td className="p-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                        p.status === "PAID" ? "border-green-200 bg-green-50 text-green-700" :
                        p.status === "FAILED" ? "border-red-200 bg-red-50 text-red-700" :
                        "border-amber-200 bg-amber-50 text-amber-700"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-[#333333]/70">{p.referenceNumber || "—"}</td>
                    <td className="p-4 text-[#333333]/70" suppressHydrationWarning>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="p-4">
                      <Link href={ADMIN_ROUTES.orderDetail(p.orderId)} className="text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>View order</Link>
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
