const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invitationSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    type: { type: String, enum: ['invite', 'request'], default: 'invite' },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'canceled'], default: 'pending' },
    message: { type: String, trim: true },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invitation', invitationSchema);
