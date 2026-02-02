import mongoose, { Schema, model, models } from "mongoose";
import { PRODUCT_STATUS } from "@/lib/constants";

const ProductImageSchema = new Schema(
  {
    url: { type: String, required: true },
    altText: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    size: { type: String, required: true },
    color: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    variantSKU: { type: String, required: true },
  },
  { _id: false }
);

export interface IProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  images: { url: string; altText: string; order: number }[];
  variants: { size: string; color: string; stock: number; variantSKU: string }[];
  status: (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
  categoryId: string;
  material: string;
  rating: number;
  SKU: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: null },
    images: { type: [ProductImageSchema], default: [] },
    variants: { type: [ProductVariantSchema], default: [] },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
    },
    categoryId: { type: String, default: "" },
    material: { type: String, default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    SKU: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ProductSchema.index({ status: 1 });
ProductSchema.index({ name: "text", description: "text" });

ProductSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Product = models.Product ?? model<IProduct>("Product", ProductSchema);
