"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import {
  Check,
  ChevronRight,
  Lock,
  Package,
  Truck,
  CreditCard,
  Copy,
  ArrowLeft,
  Loader2,
  MapPin,
  User,
  Phone,
  Home,
  Building,
  Globe,
  Mail,
} from "lucide-react";
import { useCartStore, type CartStoreItem } from "@/store/cartStore";
import { useCart, clearCart as clearCartApi } from "@/lib/api/cart";
import { createOrder, confirmPayment, getOrdersErrorMessage } from "@/lib/api/orders";
import { PAYMENT_METHOD } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { Container } from "@/components/layout/Container";
import { useToast } from "@/components/ui/toast";
import {
  shippingAddressSchema,
  type ShippingAddressValues,
} from "@/lib/validations";

const GOLD = "#C4A747";
const CREAM = "#F5F3EE";
const SAGE = "#5BA383";
const DARK = "#333333";

const STEPS = [
  { key: "auth", label: "Sign In", icon: User },
  { key: "shipping", label: "Shipping", icon: Truck },
  { key: "review", label: "Review & Payment", icon: Package },
  { key: "confirmation", label: "Confirmation", icon: Check },
];

const PAYMENT_OPTIONS = [
  { value: PAYMENT_METHOD.EASYPAISA, label: "Easypaisa" },
  { value: PAYMENT_METHOD.JAZZCASH, label: "JazzCash" },
  { value: PAYMENT_METHOD.BANK_TRANSFER, label: "Bank Transfer" },
] as const;

// Progress Stepper
function ProgressStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Checkout progress" className="mb-8 lg:mb-12">
      <ol className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const isActive = currentStep === stepNum;
          const isComplete = currentStep > stepNum;
          const Icon = step.icon;

          return (
            <li
              key={step.key}
              className={cn(
                "flex flex-1 items-center",
                i < STEPS.length - 1 && "after:mx-2 after:flex-1 after:border-t-2 after:content-[''] lg:after:mx-4",
                isComplete
                  ? "after:border-[#C4A747]"
                  : "after:border-[#ddd]"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all lg:h-12 lg:w-12",
                    isComplete &&
                      "border-[#C4A747] bg-[#C4A747] text-white",
                    isActive &&
                      "border-[#C4A747] bg-white text-[#C4A747]",
                    !isComplete &&
                      !isActive &&
                      "border-[#ddd] bg-white text-[#999]"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block lg:text-sm",
                    isActive || isComplete
                      ? "text-[#333333]"
                      : "text-[#999]"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Mini Order Summary
function MiniOrderSummary({
  items,
  subtotal,
}: {
  items: CartStoreItem[];
  subtotal: number;
}) {
  const shippingFree = subtotal >= 5000;
  const shipping = shippingFree ? 0 : 500;
  const total = subtotal + shipping;

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: CREAM }}>
      <h3 className="text-lg font-bold text-[#333333]">Order Summary</h3>
      <div className="mt-4 max-h-[240px] space-y-3 overflow-y-auto">
        {items.map((item) => {
          const variant = item.product.variants.find(
            (v) => v.variantSKU === item.variantSKU
          );
          const price = item.product.salePrice ?? item.product.price;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                <Image
                  src={item.product.images[0]?.url ?? "/placeholder.svg"}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-[#333333]">
                  {item.product.name}
                </p>
                <p className="text-xs text-[#333333]/60">
                  {variant?.size} / {variant?.color} × {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-[#333333]">
                {formatPrice(price * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>
      <dl className="mt-4 space-y-2 border-t border-[#333333]/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-[#333333]/70">Subtotal</dt>
          <dd className="font-medium text-[#333333]">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[#333333]/70">Shipping</dt>
          <dd className={shippingFree ? "text-green-600" : "text-[#333333]"}>
            {shippingFree ? "Free" : formatPrice(shipping)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-[#333333]/10 pt-2 text-lg font-bold text-[#333333]">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>
    </div>
  );
}

// Form Input Component
function FormField({
  label,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#333333]">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#999]" />
        )}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const { data: apiCart } = useCart({ enabled: isAuthenticated });
  const { items: zustandItems, getCartTotal, clearCart: clearZustandCart } = useCartStore();

  const [step, setStep] = useState(1);
  const [isGuest, setIsGuest] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressValues | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHOD.EASYPAISA);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const cartItemsForOrder = isAuthenticated && apiCart?.items
    ? apiCart.items.filter((i) => i.product).map((i) => ({
        product: i.product!,
        id: i.id,
        productId: i.productId,
        variantSKU: i.variantSKU,
        quantity: i.quantity,
      }))
    : hasMounted
      ? zustandItems
      : [];
  const cartItems = cartItemsForOrder as CartStoreItem[];
  const subtotal = cartItems.reduce(
    (sum, i) => sum + (i.product.salePrice ?? i.product.price) * i.quantity,
    0
  );
  const shippingFee = subtotal >= 5000 ? 0 : 500;
  const total = subtotal + shippingFee;
  const canProceedFromAuth = isAuthenticated || isGuest;

  const shippingForm = useForm<ShippingAddressValues>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      fullName: session?.user?.name ?? "",
      phone: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Pakistan",
    },
  });

  // Auto-advance authenticated users
  useEffect(() => {
    if (status === "authenticated" && step === 1) {
      setStep(2);
    }
  }, [status, step]);

  const handleContinueAsGuest = () => {
    setIsGuest(true);
    setStep(2);
  };

  const onShippingSubmit = (data: ShippingAddressValues) => {
    setShippingAddress(data);
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress || cartItems.length === 0 || !agreedToTerms) return;
    if (!isAuthenticated) {
      toast("Please sign in to place order", "error");
      return;
    }
    setIsPlacing(true);
    try {
      const orderItems = apiCart?.items?.filter((i) => i.product).map((i) => ({
        productId: i.productId,
        variantSKU: i.variantSKU,
        quantity: i.quantity,
      })) ?? [];
      if (orderItems.length === 0) {
        toast("Your cart is empty", "error");
        setIsPlacing(false);
        return;
      }
      const order = await createOrder({
        items: orderItems,
        shippingAddress: {
          id: "",
          userId: "",
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          isDefault: false,
        },
        paymentMethod,
      });
      await confirmPayment(order.id);
      await clearCartApi();
      clearZustandCart();
      setOrderNumber(order.orderNumber);
      setOrderId(order.id);
      setStep(4);
      toast("Order placed successfully!", "success");
    } catch (err) {
      toast(getOrdersErrorMessage(err) ?? "Failed to place order", "error");
    } finally {
      setIsPlacing(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Empty cart redirect
  if (hasMounted && cartItems.length === 0 && step < 4) {
    return (
      <Container className="flex flex-col items-center justify-center gap-6 py-20">
        <Package className="h-20 w-20 text-[#333333]/20" />
        <h1 className="text-2xl font-bold text-[#333333]">Your cart is empty</h1>
        <p className="text-[#333333]/70">Add items before checkout.</p>
        <Button asChild style={{ backgroundColor: GOLD, color: DARK }}>
          <Link href={ROUTES.shop}>Continue Shopping</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="max-w-[1200px] py-8 lg:py-12">
      <ProgressStepper currentStep={step} />

      <AnimatePresence mode="wait">
        {/* STEP 1: Authentication */}
        {step === 1 && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mx-auto max-w-[500px]"
          >
            <div className="rounded-xl border border-[#eee] bg-white p-8 text-center shadow-sm lg:p-12">
              <User className="mx-auto h-16 w-16 text-[#C4A747]" />
              <h2 className="mt-6 text-2xl font-bold text-[#333333] lg:text-[32px]">
                Sign in to checkout
              </h2>
              <p className="mt-2 text-[#333333]/70">
                Faster checkout with your account
              </p>

              <Button
                className="mt-8 h-14 w-full text-base font-semibold"
                variant="outline"
                onClick={() => signIn("google")}
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#eee]" />
                <span className="text-sm text-[#999]">OR</span>
                <div className="h-px flex-1 bg-[#eee]" />
              </div>

              <Button
                className="h-14 w-full text-base font-semibold"
                variant="outline"
                onClick={handleContinueAsGuest}
              >
                Continue as Guest
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Shipping Address */}
        {step === 2 && (
          <motion.div
            key="shipping"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="grid gap-8 lg:grid-cols-[60%_40%] lg:gap-12">
              {/* Form */}
              <div className="rounded-xl border border-[#eee] bg-white p-6 lg:p-8">
                <h2 className="text-xl font-bold text-[#333333] lg:text-2xl">
                  Shipping Address
                </h2>

                <form
                  onSubmit={shippingForm.handleSubmit(onShippingSubmit)}
                  className="mt-6 space-y-5"
                >
                  <FormField
                    label="Full Name"
                    error={shippingForm.formState.errors.fullName?.message}
                    icon={User}
                  >
                    <Input
                      {...shippingForm.register("fullName")}
                      placeholder="John Doe"
                      className={cn(
                        "h-[52px] rounded-lg border-[1.5px] pl-12 text-base",
                        shippingForm.formState.errors.fullName
                          ? "border-red-500"
                          : "border-[#ddd] focus:border-[#C4A747]"
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Phone Number"
                    error={shippingForm.formState.errors.phone?.message}
                    icon={Phone}
                  >
                    <Input
                      {...shippingForm.register("phone")}
                      placeholder="+92 300 1234567"
                      className={cn(
                        "h-[52px] rounded-lg border-[1.5px] pl-12 text-base",
                        shippingForm.formState.errors.phone
                          ? "border-red-500"
                          : "border-[#ddd] focus:border-[#C4A747]"
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Street Address"
                    error={shippingForm.formState.errors.street?.message}
                    icon={Home}
                  >
                    <Input
                      {...shippingForm.register("street")}
                      placeholder="123 Main Street, Apt 4B"
                      className={cn(
                        "h-[52px] rounded-lg border-[1.5px] pl-12 text-base",
                        shippingForm.formState.errors.street
                          ? "border-red-500"
                          : "border-[#ddd] focus:border-[#C4A747]"
                      )}
                    />
                  </FormField>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      label="City"
                      error={shippingForm.formState.errors.city?.message}
                      icon={Building}
                    >
                      <Input
                        {...shippingForm.register("city")}
                        placeholder="Lahore"
                        className={cn(
                          "h-[52px] rounded-lg border-[1.5px] pl-12 text-base",
                          shippingForm.formState.errors.city
                            ? "border-red-500"
                            : "border-[#ddd] focus:border-[#C4A747]"
                        )}
                      />
                    </FormField>

                    <FormField
                      label="State / Province"
                      error={shippingForm.formState.errors.state?.message}
                      icon={MapPin}
                    >
                      <Input
                        {...shippingForm.register("state")}
                        placeholder="Punjab"
                        className={cn(
                          "h-[52px] rounded-lg border-[1.5px] pl-12 text-base",
                          shippingForm.formState.errors.state
                            ? "border-red-500"
                            : "border-[#ddd] focus:border-[#C4A747]"
                        )}
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      label="Postal Code"
                      error={shippingForm.formState.errors.postalCode?.message}
                      icon={Mail}
                    >
                      <Input
                        {...shippingForm.register("postalCode")}
                        placeholder="54000"
                        className={cn(
                          "h-[52px] rounded-lg border-[1.5px] pl-12 text-base",
                          shippingForm.formState.errors.postalCode
                            ? "border-red-500"
                            : "border-[#ddd] focus:border-[#C4A747]"
                        )}
                      />
                    </FormField>

                    <FormField
                      label="Country"
                      error={shippingForm.formState.errors.country?.message}
                      icon={Globe}
                    >
                      <Input
                        {...shippingForm.register("country")}
                        placeholder="Pakistan"
                        className={cn(
                          "h-[52px] rounded-lg border-[1.5px] pl-12 text-base",
                          shippingForm.formState.errors.country
                            ? "border-red-500"
                            : "border-[#ddd] focus:border-[#C4A747]"
                        )}
                      />
                    </FormField>
                  </div>

                  <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-14 sm:flex-1"
                      onClick={() => setStep(1)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="h-14 sm:flex-[2]"
                      style={{ backgroundColor: GOLD, color: DARK }}
                    >
                      Continue to Review
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-[100px] lg:self-start">
                <MiniOrderSummary items={cartItems} subtotal={subtotal} />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Review Order */}
        {step === 3 && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="grid gap-8 lg:grid-cols-[60%_40%] lg:gap-12">
              <div className="space-y-6">
                {/* Shipping Address */}
                <div className="rounded-xl border border-[#eee] bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#333333]">
                      Shipping Address
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-sm font-medium text-[#C4A747] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  {shippingAddress && (
                    <div className="mt-4 text-[#333333]/80">
                      <p className="font-medium text-[#333333]">
                        {shippingAddress.fullName}
                      </p>
                      <p>{shippingAddress.street}</p>
                      <p>
                        {shippingAddress.city}, {shippingAddress.state}{" "}
                        {shippingAddress.postalCode}
                      </p>
                      <p>{shippingAddress.country}</p>
                      <p className="mt-2">{shippingAddress.phone}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="rounded-xl border border-[#eee] bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#333333]">
                      Order Items ({cartItems.length})
                    </h3>
                    <Link
                      href={ROUTES.cart}
                      className="text-sm font-medium text-[#C4A747] hover:underline"
                    >
                      Edit Cart
                    </Link>
                  </div>
                  <div className="mt-4 space-y-4">
                    {cartItems.map((item) => {
                      const variant = item.product.variants.find(
                        (v) => v.variantSKU === item.variantSKU
                      );
                      const price = item.product.salePrice ?? item.product.price;
                      return (
                        <div
                          key={item.id}
                          className="flex gap-4 border-b border-[#eee] pb-4 last:border-0 last:pb-0"
                        >
                          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={item.product.images[0]?.url ?? "/placeholder.svg"}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#333333]">
                              {item.product.name}
                            </p>
                            <p className="text-sm text-[#333333]/60">
                              {variant?.size} / {variant?.color} × {item.quantity}
                            </p>
                          </div>
                          <p className="shrink-0 font-semibold text-[#333333]">
                            {formatPrice(price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="rounded-xl border border-[#eee] bg-white p-6">
                  <h3 className="text-lg font-bold text-[#333333]">
                    Payment Method
                  </h3>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="flex items-center gap-2 rounded-lg px-4 py-2"
                      style={{ backgroundColor: CREAM }}
                    >
                      <CreditCard className="h-5 w-5 text-[#333333]" />
                      <span className="font-medium text-[#333333]">
                        Cash on Delivery
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-[#ddd] text-[#C4A747] focus:ring-[#C4A747]"
                  />
                  <span className="text-sm text-[#333333]/80">
                    I agree to the{" "}
                    <button
                      type="button"
                      className="font-medium text-[#C4A747] underline-offset-2 hover:underline"
                    >
                      Terms and Conditions
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="font-medium text-[#C4A747] underline-offset-2 hover:underline"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>

                {/* Actions */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 sm:flex-1"
                    onClick={() => setStep(2)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className="h-14 sm:flex-[2]"
                    style={{ backgroundColor: GOLD, color: DARK }}
                    onClick={handlePlaceOrder}
                    disabled={!agreedToTerms || isPlacing}
                  >
                    {isPlacing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Place Order — {formatPrice(total)}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-[100px] lg:self-start">
                <MiniOrderSummary items={cartItems} subtotal={subtotal} />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Confirmation */}
        {step === 4 && orderNumber && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-[600px]"
          >
            <div className="rounded-xl border border-[#eee] bg-white p-8 text-center lg:p-12">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
                style={{ backgroundColor: SAGE }}
              >
                <Check className="h-10 w-10 text-white" />
              </motion.div>

              <h2 className="mt-6 text-2xl font-bold text-[#333333] lg:text-[36px]">
                Order Placed Successfully!
              </h2>
              <p className="mt-2 text-[#333333]/70">
                We&apos;ve sent a confirmation to your email
              </p>

              {/* Order Number */}
              <div className="mt-8">
                <p className="text-sm font-medium text-[#333333]/70">
                  Order Number
                </p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <span
                    className="text-2xl font-bold lg:text-3xl"
                    style={{ color: GOLD }}
                  >
                    {orderNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyOrderNumber}
                    className="rounded-lg p-2 text-[#333333]/50 transition hover:bg-[#F5F3EE] hover:text-[#333333]"
                    aria-label="Copy order number"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Estimated Delivery */}
              <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: CREAM }}>
                <div className="flex items-center justify-center gap-2">
                  <Truck className="h-5 w-5" style={{ color: SAGE }} />
                  <span className="font-medium text-[#333333]">
                    Estimated Delivery
                  </span>
                </div>
                <p className="mt-1 text-[#333333]/70" suppressHydrationWarning>
                  {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  )}{" "}
                  -{" "}
                  {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </p>
              </div>

              {/* Order Timeline */}
              <div className="mt-8 space-y-4">
                {[
                  { label: "Order Confirmed", done: true },
                  { label: "Processing", done: false },
                  { label: "Shipped", done: false },
                  { label: "Delivered", done: false },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                        s.done
                          ? "bg-[#C4A747] text-white"
                          : "bg-[#eee] text-[#999]"
                      )}
                    >
                      {s.done ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        s.done ? "font-medium text-[#333333]" : "text-[#999]"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-4">
                <Button
                  asChild
                  className="h-14 text-base font-semibold"
                  style={{ backgroundColor: GOLD, color: DARK }}
                >
                  <Link href={orderId ? `${ROUTES.account}/orders/${orderId}` : ROUTES.account}>
                    View Order Details
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-14 text-base">
                  <Link href={ROUTES.shop}>Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}
