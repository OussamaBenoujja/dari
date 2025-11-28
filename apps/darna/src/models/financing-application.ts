import mongoose, { Schema } from "mongoose";

const financingApplicationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: "RealEstate", index: true },
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
    amount: { type: Number, required: true, min: 0 },
    downPayment: { type: Number, min: 0 },
    termMonths: { type: Number, required: true, min: 6 },
    annualRate: { type: Number, required: true, min: 0 },
    bankCode: { type: String, required: true, uppercase: true },
    status: { type: String, enum: ["draft", "submitted", "approved", "rejected"], default: "submitted", index: true },
    simulation: {
      monthlyPayment: Number,
      totalInterest: Number,
      totalCost: Number,
    },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true },
);

financingApplicationSchema.index({ bankCode: 1, status: 1 });

const FinancingApplication = mongoose.model("FinancingApplication", financingApplicationSchema);

export default FinancingApplication;
