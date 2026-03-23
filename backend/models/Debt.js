const mongoose = require('mongoose');

const debtPaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile_money', 'transfer', 'check', 'Espèces', 'Mobile Money (Orange/Areeba)', 'Chèque / Virement'],
    default: 'cash'
  },
  note: String,
  receiptId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice'
  },
  receivedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  paidAt: {
    type: Date,
    default: Date.now
  }
});

const debtSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  clientPhone: String,
  totalAmount: {
    type: Number,
    required: true
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  products: String, // Description of products
  note: String,
  status: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid', 'overdue'],
    default: 'unpaid'
  },
  saleId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Sale'
  },
  payments: [debtPaymentSchema],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
});

// Update status before saving
debtSchema.pre('save', function() {
  if (this.remainingAmount <= 0) {
    this.status = 'paid';
  } else if (this.remainingAmount < this.totalAmount) {
    this.status = 'partially_paid';
  }
  
  // Check if overdue
  if (this.status !== 'paid' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
});

module.exports = mongoose.model('Debt', debtSchema);
