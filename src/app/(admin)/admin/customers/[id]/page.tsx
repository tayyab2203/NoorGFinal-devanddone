"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useAdminUser } from "@/lib/api/admin";
import { ADMIN_ROUTES, COLORS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { OrderResponse } from "@/lib/api/orders";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data, isLoading } = useAdminUser(id);
  const user = data?.user;
  const orders = (data?.orders ?? []) as OrderResponse[];

  if (isLoading || !id) {
    return (
      <div className="space-y-6">
        <Link href={ADMIN_ROUTES.customers} className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Link href={ADMIN_ROUTES.customers} className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">Customer not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={ADMIN_ROUTES.customers} className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <div className="rounded-xl border border-[#eee] bg-white p-6">
        <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          {user.image ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
              <Image src={user.image} alt="" fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE] text-xl font-semibold" style={{ color: COLORS.goldAccent }}>{user.name?.charAt(0) ?? "?"}</div>
          )}
          <div>
            <p className="font-semibold" style={{ color: COLORS.primaryDark }}>{user.name}</p>
            <p className="text-sm text-[#333333]/70">{user.email}</p>
            <p className="text-xs text-[#333333]/60">Role: {user.role}</p>
            <p className="text-xs text-[#333333]/60" suppressHydrationWarning>Registered: {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US") : "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#eee] bg-white p-6">
        <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>Order history</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-[#333333]/70">No orders yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((o) => (
              <Link key={o.id} href={ADMIN_ROUTES.orderDetail(o.id)} className="flex items-center justify-between rounded-lg border border-[#eee] p-4 transition hover:border-[#C4A747] hover:bg-[#F5F3EE]/50">
                <div>
                  <p className="font-medium" style={{ color: COLORS.primaryDark }}>{o.orderNumber}</p>
                  <p className="text-sm text-[#333333]/70" suppressHydrationWarning>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-US") : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: COLORS.primaryDark }}>{formatPrice(o.totalAmount)}</p>
                  <p className="text-xs text-[#333333]/60">{o.orderStatus}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
