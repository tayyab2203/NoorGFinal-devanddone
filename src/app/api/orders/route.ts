import { connectDB } from "@/lib/db/mongodb";
import { Order, Payment, Product } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { getSession, requireAuth } from "@/lib/auth-server";
import { orderCreateSchema } from "@/lib/validations";
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import mongoose from "mongoose";
import type { OrderResponse } from "@/lib/api/orders";
import type { Order as OrderType } from "@/types";

const SHIPPING_FEE = 500;

function orderToResponse(doc: {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: { productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number; unitPrice: number }[];
  shippingAddress: Record<string, string>;
  paymentMethod: string;
  orderStatus: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  createdAt: Date;
}): OrderResponse {
  return {
    id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    userId: doc.userId.toString(),
    items: doc.items.map((i) => ({
      productId: i.productId.toString(),
      variantSKU: i.variantSKU,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    shippingAddress: {
      id: "",
      userId: doc.userId.toString(),
      ...doc.shippingAddress,
      isDefault: false,
    } as OrderType["shippingAddress"],
    paymentMethod: doc.paymentMethod,
    paymentStatus: doc.paymentStatus as OrderType["paymentStatus"],
    orderStatus: doc.orderStatus as OrderType["orderStatus"],
    subtotal: doc.subtotal,
    shippingFee: doc.shippingFee,
    totalAmount: doc.totalAmount,
    createdAt: doc.createdAt.toISOString?.() ?? new Date(doc.createdAt).toISOString(),
  };
}

/** GET /api/orders - list current user's orders (auth required) */
export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return error("Unauthorized", 401);

  try {
    await connectDB();
    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const response = orders.map((o) => orderToResponse(o as Parameters<typeof orderToResponse>[0]));
    return success(response);
  } catch (e) {
    console.error("[api/orders] GET:", e);
    return error("Failed to fetch orders", 500);
  }
}

/** POST /api/orders - create order (auth required) */
export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return error("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors
      ? Object.values(parsed.error.flatten().fieldErrors)
          .flat()
          .join(", ")
      : "Invalid body";
    return error(msg, 400);
  }
  const { items: rawItems, shippingAddress, paymentMethod } = parsed.data;

  try {
    await connectDB();

    const orderItems: { productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number; unitPrice: number }[] = [];
    let subtotal = 0;

    for (const raw of rawItems) {
      const product = await Product.findOne({
        _id: new mongoose.Types.ObjectId(raw.productId),
        status: "ACTIVE",
      }).lean();
      if (!product) return error(`Product not found or inactive: ${raw.productId}`, 400);
      const variant = (product as { variants: { variantSKU: string; stock: number }[] }).variants?.find(
        (v) => v.variantSKU === raw.variantSKU
      );
      if (!variant) return error(`Variant not found: ${raw.variantSKU}`, 400);
      if (variant.stock < raw.quantity) return error(`Insufficient stock for ${raw.variantSKU}`, 400);

      const price = (product as { salePrice: number | null; price: number }).salePrice ?? (product as { price: number }).price;
      const unitPrice = typeof price === "number" ? price : Number(price);
      orderItems.push({
        productId: new mongoose.Types.ObjectId(raw.productId),
        variantSKU: raw.variantSKU,
        quantity: raw.quantity,
        unitPrice,
      });
      subtotal += unitPrice * raw.quantity;
    }

    const shippingFee = SHIPPING_FEE;
    const totalAmount = subtotal + shippingFee;

    let orderNumber =
      "ALN-" +
      Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
    let existing = await Order.findOne({ orderNumber }).lean();
    while (existing) {
      orderNumber = "ALN-" + Date.now().toString(36).toUpperCase().slice(-8);
      existing = await Order.findOne({ orderNumber }).lean();
    }

    const order = await Order.create({
      orderNumber,
      userId: new mongoose.Types.ObjectId(userId),
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
      paymentMethod,
      orderStatus: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      subtotal,
      shippingFee,
      totalAmount,
    });

    await Payment.create({
      orderId: order._id,
      method: paymentMethod as keyof typeof PAYMENT_METHOD,
      status: "PENDING",
      referenceNumber: "MOCK-" + Date.now(),
    });

    const populated = await Order.findById(order._id).lean().exec();
    const response = orderToResponse(populated as Parameters<typeof orderToResponse>[0]);
    return success(response);
  } catch (e) {
    console.error("[api/orders] POST:", e);
    return error("Failed to create order", 500);
  }
}
