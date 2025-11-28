import mongoose, { Schema } from "mongoose";

const leadStatuses = ["new", "in_progress", "won", "lost", "archived"] as const;

const leadSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "RealEstate", required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation" },
    initialMessage: { type: String, trim: true },
    status: { type: String, enum: leadStatuses, default: "new", index: true },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    budget: { type: Number, min: 0 },
    moveInDate: { type: Date },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true },
);

leadSchema.index({ owner: 1, status: 1, updatedAt: -1 });
leadSchema.index({ buyer: 1, createdAt: -1 });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
export type LeadStatus = typeof leadStatuses[number];
