const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const verificationRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    verificationType: {
      type: String,
      enum: ["passport", "driving license", "national ID card"],
      required: true,
    },
    idNumber: { type: String, required: true, trim: true },
    idDocumentPath: { type: String, required: true },
    selfiePath: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "auto_approved",
        "manual_review",
        "approved",
        "rejected",
      ],
      default: "pending",
    },
    autoMatched: { type: Boolean, default: false },
    autoScore: { type: Number },
    reason: { type: String },
    reviewer: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNotes: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "VerificationRequest",
  verificationRequestSchema,
);
