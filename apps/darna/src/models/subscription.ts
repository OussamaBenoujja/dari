import mongoose, { Schema } from "mongoose";

const subscriptionStatuses = ["active", "inactive", "canceled", "past_due"] as const;

const subscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    status: { type: String, enum: subscriptionStatuses, default: "active", index: true },
    startedAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date },
    renewsAt: { type: Date },
    canceledAt: { type: Date },
    cancellationReason: { type: String, trim: true },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true },
);

subscriptionSchema.index({ user: 1, status: 1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
export type SubscriptionStatus = typeof subscriptionStatuses[number];
