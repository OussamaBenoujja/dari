import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    message: { type: String, trim: true },
    payload: { type: Schema.Types.Mixed },
    channel: { type: String, default: "in-app" },
  channels: { type: [String], default: undefined },
    readAt: { type: Date, index: true },
    deliveredAt: { type: Date },
    expiresAt: { type: Date },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
