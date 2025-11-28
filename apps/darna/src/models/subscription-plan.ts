import mongoose, { Schema } from "mongoose";

const billingIntervals = ["monthly", "yearly"] as const;

const subscriptionPlanSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "MAD", uppercase: true, maxlength: 6 },
    interval: { type: String, enum: billingIntervals, default: "monthly" },
    features: { type: [String], default: [] },
    listingLimit: { type: Number, default: 0 },
    visibilityBoost: { type: Number, default: 0 },
    priority: { type: Number, default: 0, index: true },
    isDefault: { type: Boolean, default: false },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true },
);

subscriptionPlanSchema.index({ priority: -1, price: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
export type BillingInterval = typeof billingIntervals[number];
