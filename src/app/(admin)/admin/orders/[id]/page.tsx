"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useOrderById, updateOrder, getOrdersErrorMessage } from "@/lib/api/orders";
import { useQueryClient } from "react-query";
import { ordersKeys } from "@/lib/api/orders";
import { ADMIN_ROUTES, COLORS, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useOrderById(id);
  const [orderStatus, setOrderStatus] = useState(order?.orderStatus ?? ORDER_STATUS.PENDING);
  const [paymentStatus, setPaymentStatus] = useState(order?.paymentStatus ?? PAYMENT_STATUS.PENDING);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;
    setOrderStatus(order.orderStatus ?? ORDER_STATUS.PENDING);
    setPaymentStatus(order.paymentStatus ?? PAYMENT_STATUS.PENDING);
  }, [order?.id, order?.orderStatus, order?.paymentStatus]);

  const handleUpdateStatus = async () => {
    if (!id) return;
    setIsUpdating(true);
    setError(null);
    try {
      await updateOrder(id, { orderStatus, paymentStatus });
      queryClient.invalidateQueries(ordersKeys.adminList());
      queryClient.invalidateQueries(ordersKeys.detail(id));
    } catch (e) {
      setError(getOrdersErrorMessage(e) ?? "Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !id) {
    return (
      <div className="space-y-6">
        <Link href={ADMIN_ROUTES.orders} className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link href={ADMIN_ROUTES.orders} className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">Order not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={ADMIN_ROUTES.orders}
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: COLORS.goldAccent }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
          Order {order.orderNumber}
        </h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-[#eee] bg-white p-6">
            <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>
              Status
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>
                  Order status
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
                >
                  {Object.values(ORDER_STATUS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>
                  Payment status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
                >
                  {Object.values(PAYMENT_STATUS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleUpdateStatus}
                disabled={isUpdating || (orderStatus === order.orderStatus && paymentStatus === order.paymentStatus)}
                style={{ backgroundColor: COLORS.goldAccent, color: COLORS.primaryDark }}
              >
                {isUpdating ? "Updating…" : "Update status"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[#eee] bg-white p-6">
            <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>
              Shipping address
            </h2>
            <div className="mt-4 text-sm text-[#333333]/80">
              <p className="font-medium text-[#333333]">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              <p className="mt-2">{order.shippingAddress?.phone}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#eee] bg-white p-6">
            <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>
              Payment
            </h2>
            <p className="mt-2 text-sm text-[#333333]/80">
              Method: {order.paymentMethod}
            </p>
            <p className="text-sm text-[#333333]/80">
              Status: {order.paymentStatus}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[#eee] bg-white p-6">
          <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>
            Order items
          </h2>
          <div className="mt-4 space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 border-b border-[#eee] pb-4 last:border-0 last:pb-0">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src="/placeholder.svg" alt="" fill className="object-cover" sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#333333]">Item ({item.variantSKU})</p>
                  <p className="text-xs text-[#333333]/60">Qty: {item.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[#333333]">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <dl className="mt-4 space-y-2 border-t border-[#eee] pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#333333]/70">Subtotal</dt>
              <dd className="font-medium">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#333333]/70">Shipping</dt>
              <dd className="font-medium">{formatPrice(order.shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-[#eee] pt-2 text-lg font-bold" style={{ color: COLORS.primaryDark }}>
              <dt>Total</dt>
              <dd>{formatPrice(order.totalAmount)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
