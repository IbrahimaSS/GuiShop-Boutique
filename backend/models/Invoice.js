const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['invoice', 'receipt'],
    default: 'invoice'
  },
  clientName: String,
  clientPhone: String,
  items: [Object], // Snapshot of items
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'paid'
  },
  sale: {
    type: mongoose.Schema.ObjectId,
    ref: 'Sale'
  },
  debtPayment: {
    type: mongoose.Schema.ObjectId,
    ref: 'DebtPayment'
  },
  issuedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Invoice', invoiceSchema);
