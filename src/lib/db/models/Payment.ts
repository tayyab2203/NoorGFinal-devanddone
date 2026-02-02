import mongoose, { Schema, model, models } from "mongoose";
import { PAYMENT_METHOD } from "@/lib/constants";

const PAYMENT_STATUS_VALUES = ["PENDING", "PAID", "FAILED"] as const;

export interface IPayment {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  method: (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
  status: (typeof PAYMENT_STATUS_VALUES)[number];
  referenceNumber: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: "PENDING",
    },
    referenceNumber: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PaymentSchema.index({ orderId: 1 });

PaymentSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    ret.orderId = ret.orderId?.toString?.() ?? ret.orderId;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Payment =
  models.Payment ?? model<IPayment>("Payment", PaymentSchema);
