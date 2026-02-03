"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  RotateCcw,
  Eye,
  Filter,
} from "lucide-react";
import { useOrders } from "@/lib/api/orders";
import { getProducts } from "@/lib/api/products";
import type { OrderResponse } from "@/lib/api/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROUTES, ORDER_STATUS } from "@/lib/constants";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const GOLD = "#C4A747";
const ITEMS_PER_PAGE = 5;

const STATUS_STYLES: Record<string, string> = {
  [ORDER_STATUS.PROCESSING]: "bg-amber-100 text-amber-700 border-amber-200",
  [ORDER_STATUS.SHIPPED]: "bg-blue-100 text-blue-700 border-blue-200",
  [ORDER_STATUS.DELIVERED]: "bg-green-100 text-green-700 border-green-200",
  [ORDER_STATUS.PENDING]: "bg-gray-100 text-gray-700 border-gray-200",
  [ORDER_STATUS.CONFIRMED]: "bg-sky-100 text-sky-700 border-sky-200",
  [ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-700 border-red-200",
  [ORDER_STATUS.REFUNDED]: "bg-gray-100 text-gray-600 border-gray-200",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: ORDER_STATUS.PROCESSING, label: "Processing" },
  { value: ORDER_STATUS.SHIPPED, label: "Shipped" },
  { value: ORDER_STATUS.DELIVERED, label: "Delivered" },
];

function getFirstImageUrl(product: { images?: Array<{ url?: string } | string> } | null): string {
  if (!product?.images?.length) return PLACEHOLDER_IMAGE;
  const first = product.images[0];
  if (typeof first === "string") return first;
  return (first?.url ?? PLACEHOLDER_IMAGE) || PLACEHOLDER_IMAGE;
}

function getOrderImageUrls(
  order: OrderResponse,
  productImageMap: Map<string, string>
): string[] {
  return order.items.slice(0, 4).map((item) => {
    const url = productImageMap.get(item.productId);
    return url ?? PLACEHOLDER_IMAGE;
  });
}

function getProductNames(order: OrderResponse) {
  const n = order.items.length;
  return n === 0 ? "No items" : n === 1 ? "1 item" : `${n} items`;
}

export default function AccountOrdersPage() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: orders = [], isLoading } = useOrders();

  const filtered = useMemo(() => {
    let list = [...orders];

    if (filter !== "all") {
      list = list.filter((o) => o.orderStatus === filter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => o.orderNumber.toLowerCase().includes(q));
    }

    list.sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
    );

    return list;
  }, [orders, filter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const orderProductIds = useMemo(() => {
    const ids = new Set<string>();
    paginated.forEach((o) => o.items.forEach((i) => ids.add(i.productId)));
    return [...ids];
  }, [paginated]);

  const { data: orderProducts = [] } = useQuery({
    queryKey: ["products", "orderList", orderProductIds],
    queryFn: () => getProducts({ ids: orderProductIds }),
    enabled: orderProductIds.length > 0,
  });

  const productImageMap = useMemo(() => {
    const map = new Map<string, string>();
    orderProducts.forEach((p) => map.set(p.id, getFirstImageUrl(p)));
    return map;
  }, [orderProducts]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-[#333333] md:text-[32px]">
          My Orders
        </h1>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Loading orders...
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-[#333333] md:text-[32px]">
          My Orders
        </h1>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 py-20 text-center">
          <Package className="h-20 w-20 text-[#333333]/20" />
          <p className="mt-4 text-lg font-medium text-[#333333]">
            No orders yet
          </p>
          <p className="mt-1 text-sm text-[#333333]/70">
            Start shopping to see your orders here
          </p>
          <Button
            asChild
            className="mt-6"
            style={{ backgroundColor: GOLD, color: "#333333" }}
          >
            <Link href={ROUTES.shop}>Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[#333333] md:text-[32px]">
          My Orders
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-lg border-[#ddd] pl-10 sm:w-[280px]"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setFilter(opt.value);
              setPage(1);
            }}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
              filter === opt.value
                ? "border-[#C4A747] bg-[#C4A747]/10 text-[#C4A747]"
                : "border-[#ddd] text-[#333333] hover:border-[#C4A747]/50"
            )}
          >
            {opt.value !== "all" && <Filter className="h-3 w-3" />}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {paginated.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 py-16 text-center"
            >
              <p className="text-[#333333]/70">No orders found</p>
            </motion.div>
          ) : (
            paginated.map((order, index) => {
              const images = getOrderImageUrls(order, productImageMap);
              const productNames = getProductNames(order);
              const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-xl border border-[#eee] bg-white p-4 transition-all hover:border-[#C4A747] hover:shadow-md md:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
                    {/* Left: Order Info */}
                    <div className="flex-1 space-y-3">
                      {/* Order Number & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-semibold text-[#333333] md:text-lg">
                            {order.orderNumber}
                          </span>
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium",
                              STATUS_STYLES[order.orderStatus] ?? "bg-gray-100"
                            )}
                          >
                            {order.orderStatus}
                          </span>
                        </div>
                        <span className="text-sm text-[#333333]/60" suppressHydrationWarning>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </span>
                      </div>

                      {/* Product Thumbnails */}
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          {images.map((img, i) => (
                            <div
                              key={i}
                              className="relative h-14 w-14 overflow-hidden rounded-lg border-2 border-white bg-muted md:h-16 md:w-16"
                            >
                              <Image
                                src={img}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="64px"
                                onError={(e) => {
                                  if (e.currentTarget.src !== PLACEHOLDER_IMAGE)
                                    e.currentTarget.src = PLACEHOLDER_IMAGE;
                                }}
                              />
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-white bg-[#F5F3EE] text-xs font-medium text-[#333333] md:h-16 md:w-16">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product summary */}
                      <p className="text-sm text-[#333333]/70">
                        {productNames}
                      </p>
                    </div>

                    {/* Right: Total & Actions */}
                    <div className="flex flex-row items-center justify-between gap-4 border-t border-[#eee] pt-4 lg:flex-col lg:items-end lg:border-0 lg:pt-0">
                      <div className="text-right">
                        <p className="text-sm text-[#333333]/60">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </p>
                        <p className="text-xl font-bold text-[#333333] md:text-2xl">
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-[#C4A747] text-[#333333] hover:bg-[#C4A747]/10"
                        >
                          <Link href={`${ROUTES.account}/orders/${order.id}`}>
                            <Eye className="mr-1.5 h-4 w-4" />
                            View Details
                          </Link>
                        </Button>

                        {order.orderStatus === ORDER_STATUS.SHIPPED && (
                          <Button
                            size="sm"
                            className="bg-blue-500 text-white hover:bg-blue-600"
                          >
                            <Truck className="mr-1.5 h-4 w-4" />
                            Track Order
                          </Button>
                        )}

                        {order.orderStatus === ORDER_STATUS.DELIVERED && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#ddd] text-[#333333]"
                          >
                            <RotateCcw className="mr-1.5 h-4 w-4" />
                            Reorder
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ddd] text-[#333333] transition hover:border-[#C4A747] disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPage(num)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition",
                page === num
                  ? "bg-[#C4A747] text-white"
                  : "border border-[#ddd] text-[#333333] hover:border-[#C4A747]"
              )}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ddd] text-[#333333] transition hover:border-[#C4A747] disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
