"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Lock,
  Shield,
  Truck,
  CreditCard,
  Tag,
  Check,
  X,
} from "lucide-react";
import { useCartStore, type CartStoreItem } from "@/store/cartStore";
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
  mergeCart,
  type CartItemResponse,
} from "@/lib/api/cart";
import { useQueryClient } from "react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const GOLD = "#C4A747";
const CREAM = "#F5F3EE";
const SAGE = "#5BA383";

/** Map API cart item to CartStoreItem shape for shared UI */
function toCartStoreItem(item: CartItemResponse): CartStoreItem | null {
  if (!item.product) return null;
  return {
    id: item.id,
    product: item.product,
    variantSKU: item.variantSKU,
    quantity: item.quantity,
  };
}

function CartItemCard({
  item,
  onUpdateQty,
  onRemove,
  isUpdating,
}: {
  item: CartStoreItem;
  onUpdateQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating: string | null;
}) {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const variant = item.product.variants.find((v) => v.variantSKU === item.variantSKU);
  const size = variant?.size ?? "";
  const color = variant?.color ?? "";
  const unitPrice = item.product.salePrice ?? item.product.price;
  const lineTotal = unitPrice * item.quantity;
  const maxQty = variant?.stock ?? 99;
  const inStock = (variant?.stock ?? 0) > 0;
  const busy = isUpdating === item.id;

  const handleRemove = () => {
    if (showConfirmRemove) {
      onRemove(item.id);
      setShowConfirmRemove(false);
    } else {
      setShowConfirmRemove(true);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="relative rounded-xl border border-[#eee] bg-white p-4 md:p-6"
    >
      {/* Remove button - top right */}
      <div className="absolute right-3 top-3 md:right-4 md:top-4">
        <AnimatePresence mode="wait">
          {showConfirmRemove ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmRemove(false)}
                className="rounded-lg bg-gray-100 p-1.5 text-gray-600 transition hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="trash"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              type="button"
              onClick={handleRemove}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
              aria-label={`Remove ${item.product.name} from cart`}
            >
              <Trash2 className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 pr-10 md:gap-6 md:pr-12">
        {/* Product Image */}
        <Link
          href={`/products/${item.product.slug}`}
          className="relative h-[100px] w-[80px] shrink-0 overflow-hidden rounded-lg bg-muted md:h-[140px] md:w-[120px]"
        >
          <Image
            src={item.product.images[0]?.url ?? "/placeholder.svg"}
            alt={item.product.images[0]?.altText ?? item.product.name}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 80px, 120px"
          />
        </Link>

        {/* Product Details */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Link
            href={`/products/${item.product.slug}`}
            className="line-clamp-2 text-base font-semibold text-[#333333] transition hover:text-[#C4A747] md:text-lg"
          >
            {item.product.name}
          </Link>

          <p className="mt-1 text-sm text-[#333333]/70">
            Size: {size}, Color: {color}
          </p>

          <p className="mt-2 text-base font-semibold text-[#333333] md:hidden">
            {formatPrice(unitPrice)}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                inStock ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span
              className="text-xs font-medium"
              style={{ color: inStock ? SAGE : "#ef4444" }}
            >
              {inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Quantity Controls - Mobile: full width */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-lg border border-[#ddd]">
              <button
                type="button"
                onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                disabled={busy || item.quantity <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-l-lg border-r border-[#ddd] text-[#333333] transition hover:border-[#C4A747] hover:bg-[#F5F3EE] disabled:opacity-50"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-9 min-w-[60px] items-center justify-center text-base font-medium text-[#333333]">
                {busy ? "..." : item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(item.id, Math.min(maxQty, item.quantity + 1))}
                disabled={busy || item.quantity >= maxQty}
                className="flex h-9 w-9 items-center justify-center rounded-r-lg border-l border-[#ddd] text-[#333333] transition hover:border-[#C4A747] hover:bg-[#F5F3EE] disabled:opacity-50"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Item Total - Desktop */}
        <div className="hidden shrink-0 text-right md:block">
          <p className="text-xl font-bold text-[#333333]">{formatPrice(lineTotal)}</p>
          <p className="mt-1 text-sm text-[#333333]/70">
            {formatPrice(unitPrice)} each
          </p>
        </div>
      </div>

      {/* Mobile: Line Total */}
      <div className="mt-4 flex items-center justify-between border-t border-[#eee] pt-4 md:hidden">
        <span className="text-sm text-[#333333]/70">Item Total</span>
        <span className="text-lg font-bold text-[#333333]">{formatPrice(lineTotal)}</span>
      </div>
    </motion.div>
  );
}

function OrderSummary({
  subtotal,
  itemCount,
  promoCode,
  promoDiscount,
  onApplyPromo,
  onRemovePromo,
  isApplyingPromo,
  promoError,
}: {
  subtotal: number;
  itemCount: number;
  promoCode: string | null;
  promoDiscount: number;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
  isApplyingPromo: boolean;
  promoError: string | null;
}) {
  const [code, setCode] = useState("");
  const shippingFree = subtotal >= 5000; // Free shipping over Rs. 5,000
  const shipping = shippingFree ? 0 : 500;
  const total = subtotal - promoDiscount + shipping;

  const handleApply = () => {
    if (code.trim()) {
      onApplyPromo(code.trim().toUpperCase());
    }
  };

  return (
    <div className="rounded-xl p-6 md:p-8" style={{ backgroundColor: CREAM }}>
      <h2 className="text-xl font-bold text-[#333333] md:text-2xl">Order Summary</h2>

      <dl className="mt-6 space-y-4">
        <div className="flex justify-between">
          <dt className="text-[#333333]/70">Subtotal ({itemCount} items)</dt>
          <dd className="font-medium text-[#333333]">{formatPrice(subtotal)}</dd>
        </div>

        <div className="flex justify-between">
          <dt className="text-[#333333]/70">Shipping</dt>
          <dd className={cn("font-medium", shippingFree ? "text-green-600" : "text-[#333333]")}>
            {shippingFree ? "Free" : formatPrice(shipping)}
          </dd>
        </div>

        {promoDiscount > 0 && (
          <div className="flex justify-between">
            <dt className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              Discount ({promoCode})
            </dt>
            <dd className="font-medium text-green-600">-{formatPrice(promoDiscount)}</dd>
          </div>
        )}

        <div className="border-t border-[#333333]/10 pt-4">
          <div className="flex justify-between">
            <dt className="text-xl font-bold text-[#333333] md:text-2xl">Total</dt>
            <dd className="text-xl font-bold text-[#333333] md:text-2xl">
              {formatPrice(total)}
            </dd>
          </div>
        </div>
      </dl>

      {/* Promo Code */}
      <div className="mt-6">
        {promoCode ? (
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{promoCode} applied</span>
            </div>
            <button
              type="button"
              onClick={onRemovePromo}
              className="text-sm text-green-600 underline-offset-2 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Promo code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 flex-1 rounded-lg border-[#ddd] bg-white"
                disabled={isApplyingPromo}
              />
              <Button
                onClick={handleApply}
                disabled={!code.trim() || isApplyingPromo}
                className="h-11 px-5"
                style={{ backgroundColor: GOLD, color: "#333333" }}
              >
                {isApplyingPromo ? "..." : "Apply"}
              </Button>
            </div>
            {promoError && <p className="text-sm text-red-500">{promoError}</p>}
          </div>
        )}
      </div>

      {/* Checkout Button */}
      <Button
        asChild
        className="mt-6 h-14 w-full text-lg font-semibold transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: GOLD, color: "#333333" }}
      >
        <Link href={ROUTES.checkout}>
          <Lock className="mr-2 h-5 w-5" />
          Secure Checkout
        </Link>
      </Button>

      {/* Trust Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-[#333333]/10 pt-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" style={{ color: SAGE }} />
          <span className="text-xs text-[#333333]/70">Secure Payment</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" style={{ color: SAGE }} />
          <span className="text-xs text-[#333333]/70">COD Available</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5" style={{ color: SAGE }} />
          <span className="text-xs text-[#333333]/70">Fast Delivery</span>
        </div>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 rounded-full bg-[#F5F3EE] p-6">
        <ShoppingBag className="h-24 w-24 text-[#333333]/20 md:h-32 md:w-32" />
      </div>
      <h1 className="text-2xl font-bold text-[#333333] md:text-[32px]">Your cart is empty</h1>
      <p className="mt-2 text-[#333333]/70">
        Looks like you haven&apos;t added anything yet
      </p>
      <Button
        asChild
        className="mt-8 h-[52px] px-8 text-lg font-semibold"
        style={{ backgroundColor: GOLD, color: "#333333" }}
      >
        <Link href={ROUTES.shop}>Start Shopping</Link>
      </Button>
    </div>
  );
}

export default function CartPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const { items: zustandItems, updateQuantity, removeFromCart, getCartTotal, getCartItemCount, clearCart: clearZustandCart } =
    useCartStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [mergeDone, setMergeDone] = useState(false);

  const isAuthenticated = status === "authenticated";
  const { data: apiCart, isLoading: cartLoading } = useCart({ enabled: isAuthenticated });
  const updateCartItemMutation = useUpdateCartItem();
  const removeFromCartMutation = useRemoveFromCart();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Merge guest cart into API cart on login (once)
  useEffect(() => {
    if (!isAuthenticated || mergeDone || zustandItems.length === 0) return;
    setMergeDone(true);
    const itemsToMerge = zustandItems.map((i) => ({
      productId: i.product.id,
      variantSKU: i.variantSKU,
      quantity: i.quantity,
    }));
    mergeCart(itemsToMerge)
      .then(() => {
        clearZustandCart();
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when authenticated with guest items
  }, [isAuthenticated, mergeDone]);

  const cartItemsFromApi = useMemo(() => {
    if (!apiCart?.items) return [];
    return apiCart.items.map(toCartStoreItem).filter((i): i is CartStoreItem => i != null);
  }, [apiCart?.items]);

  const cartItems = isAuthenticated ? cartItemsFromApi : (hasMounted ? zustandItems : []);
  const subtotal = isAuthenticated
    ? cartItems.reduce(
        (sum, i) => sum + (i.product.salePrice ?? i.product.price) * i.quantity,
        0
      )
    : hasMounted
      ? getCartTotal()
      : 0;
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleUpdateQty = (itemId: string, qty: number) => {
    setUpdatingId(itemId);
    if (isAuthenticated) {
      updateCartItemMutation.mutate(
        { itemId, quantity: qty },
        { onSettled: () => { setTimeout(() => setUpdatingId(null), 300); } }
      );
    } else {
      updateQuantity(itemId, qty);
      setTimeout(() => setUpdatingId(null), 300);
    }
  };

  const handleRemove = (itemId: string) => {
    if (isAuthenticated) {
      removeFromCartMutation.mutate(itemId);
    } else {
      removeFromCart(itemId);
    }
  };

  const handleApplyPromo = (code: string) => {
    setIsApplyingPromo(true);
    setPromoError(null);
    setTimeout(() => {
      if (code === "SAVE10") {
        setPromoCode(code);
        setPromoDiscount(Math.round(subtotal * 0.1));
      } else if (code === "FLAT500") {
        setPromoCode(code);
        setPromoDiscount(500);
      } else {
        setPromoError("Invalid promo code");
      }
      setIsApplyingPromo(false);
    }, 500);
  };

  const handleRemovePromo = () => {
    setPromoCode(null);
    setPromoDiscount(0);
  };

  if (hasMounted && cartItems.length === 0 && !cartLoading) {
    return <EmptyCart />;
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-8 lg:px-12 lg:py-12">
      {/* Mobile: Order Summary on top */}
      <div className="mb-8 lg:hidden">
        <OrderSummary
          subtotal={subtotal}
          itemCount={itemCount}
          promoCode={promoCode}
          promoDiscount={promoDiscount}
          onApplyPromo={handleApplyPromo}
          onRemovePromo={handleRemovePromo}
          isApplyingPromo={isApplyingPromo}
          promoError={promoError}
        />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Left: Cart Items */}
        <div className="min-w-0 flex-1 lg:flex-[0_0_65%]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#333333] md:text-[40px]">
              Shopping Cart
              {hasMounted && (
                <span className="ml-3 text-xl font-normal text-[#333333]/70 md:text-2xl">
                  ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
              )}
            </h1>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQty={handleUpdateQty}
                  onRemove={handleRemove}
                  isUpdating={updatingId}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Continue Shopping */}
          <Link
            href={ROUTES.shop}
            className="mt-8 inline-flex items-center gap-2 text-base font-medium transition hover:underline"
            style={{ color: GOLD }}
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Right: Order Summary - Desktop */}
        <aside className="hidden w-full shrink-0 lg:sticky lg:top-[100px] lg:block lg:w-[35%] lg:self-start">
          <OrderSummary
            subtotal={subtotal}
            itemCount={itemCount}
            promoCode={promoCode}
            promoDiscount={promoDiscount}
            onApplyPromo={handleApplyPromo}
            onRemovePromo={handleRemovePromo}
            isApplyingPromo={isApplyingPromo}
            promoError={promoError}
          />
        </aside>
      </div>

      {/* Mobile: Fixed bottom checkout button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#eee] bg-white p-4 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#333333]/70">Total</p>
            <p className="text-xl font-bold text-[#333333]">
              {formatPrice(subtotal - promoDiscount + (subtotal >= 5000 ? 0 : 500))}
            </p>
          </div>
          <Button
            asChild
            className="h-[52px] px-8 text-base font-semibold"
            style={{ backgroundColor: GOLD, color: "#333333" }}
          >
            <Link href={ROUTES.checkout}>
              <Lock className="mr-2 h-4 w-4" />
              Checkout
            </Link>
          </Button>
        </div>
      </div>

      {/* Spacer for mobile fixed button */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
