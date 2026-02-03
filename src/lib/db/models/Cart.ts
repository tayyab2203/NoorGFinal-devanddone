import mongoose, { Schema, model, models } from "mongoose";

const CartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSKU: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: true }
);

export interface ICart {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: {
    _id: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    variantSKU: string;
    quantity: number;
  }[];
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CartSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    const out = ret as unknown as Record<string, unknown> & { _id?: { toString: () => string }; userId?: unknown; items?: unknown[] };
    out.id = out._id?.toString?.();
    out.userId = (out.userId as { toString?: () => string })?.toString?.() ?? out.userId;
    out.items = (out.items ?? []).map((item: unknown) => {
      const i = item as { _id: mongoose.Types.ObjectId; productId: mongoose.Types.ObjectId; variantSKU?: string; quantity?: number };
      return {
        id: i._id.toString(),
        productId: i.productId?.toString?.() ?? i.productId,
        variantSKU: i.variantSKU,
        quantity: i.quantity,
      };
    });
    delete out._id;
    delete out.__v;
    return out;
  },
});

export const Cart = models.Cart ?? model<ICart>("Cart", CartSchema);
