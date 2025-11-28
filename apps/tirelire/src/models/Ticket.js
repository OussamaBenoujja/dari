const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ticketSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  adminResponse: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

ticketSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('Ticket', ticketSchema)
