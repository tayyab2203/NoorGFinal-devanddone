import mongoose, { Schema, model, models } from "mongoose";

export interface ICollection {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  productIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CollectionSchema.index({ displayOrder: 1 });

CollectionSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    ret.productIds = (ret.productIds ?? []).map((id: mongoose.Types.ObjectId) =>
      id.toString()
    );
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Collection =
  models.Collection ?? model<ICollection>("Collection", CollectionSchema);
