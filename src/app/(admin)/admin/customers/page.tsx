"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminUsers } from "@/lib/api/admin";
import { ADMIN_ROUTES, COLORS } from "@/lib/constants";
import { Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminUsers({ page, limit: 20, q: search || undefined });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>Customers</h1>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>Customers</h1>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 border-[#ddd]"
        />
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#ddd] bg-white py-20 text-center text-[#333333]/70">No customers found</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-[#eee] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#eee] bg-[#F5F3EE]">
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Name</th>
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Email</th>
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Orders</th>
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Last order</th>
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Registered</th>
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[#eee] hover:bg-[#F5F3EE]/50">
                      <td className="p-4 font-medium" style={{ color: COLORS.primaryDark }}>{u.name}</td>
                      <td className="p-4 text-[#333333]/80">{u.email}</td>
                      <td className="p-4">{u.ordersCount}</td>
                      <td className="p-4 text-[#333333]/70" suppressHydrationWarning>
                        {u.lastOrderDate ? new Date(u.lastOrderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="p-4 text-[#333333]/70" suppressHydrationWarning>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="p-4">
                        <Link href={ADMIN_ROUTES.customerDetail(u.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd] px-3 py-1.5 text-sm font-medium transition hover:border-[#C4A747] hover:bg-[#F5F3EE]" style={{ color: COLORS.primaryDark }}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-[#ddd] px-3 py-1.5 text-sm disabled:opacity-50" style={{ color: COLORS.primaryDark }}>Previous</button>
              <span className="text-sm text-[#333333]/70">Page {page} of {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-[#ddd] px-3 py-1.5 text-sm disabled:opacity-50" style={{ color: COLORS.primaryDark }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
