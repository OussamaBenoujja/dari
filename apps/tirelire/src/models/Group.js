const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupSchema = new Schema({
  name: { type: String, required: true }, 
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
  members: [
    {
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      joinDate: { type: Date, default: Date.now },
      reliabilityScore: { type: Number, default: 50 }, 
      penalties: { type: Number, default: 0 },
      missedRounds: { type: Number, default: 0 },
      lastContributionRound: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      isBanned: { type: Boolean, default: false }
    },
  ],
  contributionAmount: { type: Number, required: true }, 
  contributionInterval: { type: String, enum: ['weekly', 'monthly'], default: 'monthly' },
  currentRound: { type: Number, default: 1 },
  nextPayoutIndex: { type: Number, default: 0 },
  payoutOrder: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
  roundHistory: [
    {
      roundNumber: { type: Number, required: true },
      beneficiary: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      startedAt: { type: Date, default: Date.now },
      dueDate: { type: Date },
      closedAt: { type: Date },
      status: { type: String, enum: ['scheduled', 'active', 'complete', 'defaulted'], default: 'scheduled' }
    }
  ],
  messages: [
    {
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      type: { type: String, enum: ['text', 'audio'], default: 'text' },
      content: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Group', groupSchema);
