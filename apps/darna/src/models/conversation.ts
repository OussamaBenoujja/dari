import mongoose, { Schema, Types } from "mongoose";

const participantEntry = { type: Schema.Types.ObjectId, ref: "User", required: true };

const conversationSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "RealEstate" },
    participants: { type: [participantEntry], validate: [(value: Types.ObjectId[]) => value.length >= 2, "At least two participants are required"] },
    participantHash: { type: String, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true },
);

conversationSchema.index({ participantHash: 1, listing: 1 }, { unique: true });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
