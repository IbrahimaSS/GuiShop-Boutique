const mongoose = require('mongoose');

const stockRequestSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  note: String,
  requestedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  validatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  validatedAt: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model('StockRequest', stockRequestSchema);
