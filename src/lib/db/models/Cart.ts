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
    ret.id = ret._id.toString();
    ret.userId = ret.userId?.toString?.() ?? ret.userId;
    ret.items = (ret.items ?? []).map(
      (item: { _id: mongoose.Types.ObjectId; productId: mongoose.Types.ObjectId; [k: string]: unknown }) => ({
        id: item._id.toString(),
        productId: item.productId?.toString?.() ?? item.productId,
        variantSKU: item.variantSKU,
        quantity: item.quantity,
      })
    );
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Cart = models.Cart ?? model<ICart>("Cart", CartSchema);
