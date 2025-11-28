import mongoose, { Schema } from 'mongoose';

const accountTypes = ["individual", "business", "admin"] as const;
const subscriptionTiers = ["free", "pro", "premium"] as const;
const subscriptionStatuses = ["inactive", "active", "past_due", "canceled"] as const;

const mediaSchema = new Schema({
  key: { type: String, required: true },
  url: { type: String, required: true },
  thumbnailKey: { type: String },
  thumbnailUrl: { type: String },
  contentType: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: () => new Date() },
}, { _id: false });

const userSchema = new Schema({
  keycloakId: { type: String, index: true, unique: true, sparse: true },
  email: { type: String, index: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  roles: { type: [String], default: [] },
  accountType: { type: String, enum: accountTypes, default: "individual", index: true },
  subscriptionTier: { type: String, enum: subscriptionTiers, default: "free", index: true },
  subscriptionStatus: { type: String, enum: subscriptionStatuses, default: "inactive", index: true },
  subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
  subscriptionRenewAt: { type: Date },
  visibilityBoost: { type: Number, default: 0 },
  deletedAt: { type: Date },
  profileImage: { type: mediaSchema, default: null },
  bannerImage: { type: mediaSchema, default: null },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
export type AccountType = typeof accountTypes[number];
export type SubscriptionTier = typeof subscriptionTiers[number];
