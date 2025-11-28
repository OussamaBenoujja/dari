const mongoose = require('mongoose');
const { Schema } = mongoose;

const contributionSchema = new Schema({
  group: { type: Schema.Types.ObjectId, ref: 'Group', required: true }, 
  member: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
  amount: { type: Number, required: true }, 
  round: { type: Number, required: true }, 
  status: { type: String, enum: ['pending', 'paid', 'missed'], default: 'pending' }, 
  paidAt: { type: Date }, 
  dueDate: { type: Date, required: true },
  penaltyApplied: { type: Boolean, default: false },
  penaltyCount: { type: Number, default: 0 },
  outstanding: { type: Boolean, default: false },
  stripePaymentIntentId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

contributionSchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

contributionSchema.pre('findOneAndUpdate', function(next){
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Contribution', contributionSchema);
