const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true, // Allow nulls while maintaining uniqueness for non-nulls
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Please add a purchase price'],
    default: 0,
  },
  transportFees: {
    type: Number,
    default: 0,
  },
  handlingFees: {
    type: Number,
    default: 0,
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Please add a selling price'],
    default: 0,
  },
  minSellingPrice: {
    type: Number,
    default: 0,
  },
  maxSellingPrice: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  alertThreshold: {
    type: Number,
    default: 5,
  },
  isDeposit: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock',
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

// Update status before saving
productSchema.pre('save', function() {
  if (this.stock <= 0) {
    this.status = 'out_of_stock';
  } else if (this.stock <= this.alertThreshold) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
});

module.exports = mongoose.model('Product', productSchema);
