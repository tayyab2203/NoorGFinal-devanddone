import mongoose, { Schema, model, models } from "mongoose";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSKU: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: {
    productId: mongoose.Types.ObjectId;
    variantSKU: string;
    quantity: number;
    unitPrice: number;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  orderStatus: (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
  paymentStatus: (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], default: [] },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod: { type: String, default: "" },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, createdAt: -1 });

OrderSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    const out = ret as unknown as Record<string, unknown> & { _id?: { toString: () => string }; userId?: unknown; items?: unknown[] };
    out.id = out._id?.toString?.();
    out.userId = (out.userId as { toString?: () => string })?.toString?.() ?? out.userId;
    out.items = (out.items ?? []).map((item: unknown) => {
      const i = item as Record<string, unknown> & { productId?: mongoose.Types.ObjectId };
      return { ...i, productId: i.productId?.toString?.() ?? i.productId };
    });
    delete out._id;
    delete out.__v;
    return out;
  },
});

export const Order = models.Order ?? model<IOrder>("Order", OrderSchema);
