const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: String, // Snapshot of name
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const saleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    unique: true
  },
  items: [saleItemSchema],
  subTotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['cash', 'credit', 'transfer', 'check'],
    default: 'cash'
  },
  clientName: String,
  clientPhone: String,
  status: {
    type: String,
    enum: ['standard', 'paid_undelivered', 'unpaid_delivered', 'cancelled'],
    default: 'standard'
  },
  validationStatus: {
    type: String,
    enum: ['approved'],
    default: 'approved'
  },
  invoiceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
});

// Middleware to generate sale number (VN-YYYYMMDD-XXXX)
saleSchema.pre('save', async function() {
  if (this.isNew) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } });
    this.saleNumber = `VN-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Sale', saleSchema);
