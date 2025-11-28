import mongoose, { Schema } from "mongoose";

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video", "document", "other"], default: "other" },
    name: { type: String, trim: true },
    size: { type: Number },
    key: { type: String },
    thumbnailUrl: { type: String },
    contentType: { type: String },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { _id: false },
);

const readReceiptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["text", "image", "file", "system"], default: "text" },
    content: { type: String, trim: true },
    attachments: { type: [attachmentSchema], default: [] },
    deliveredAt: { type: Date },
    readBy: { type: [readReceiptSchema], default: [] },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
