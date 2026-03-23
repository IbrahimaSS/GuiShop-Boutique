const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Please add an item name'],
    trim: true,
  },
  ownerName: {
    type: String,
    required: [true, 'Please add an owner name'],
  },
  ownerPhone: String,
  description: String,
  photo: String, // URL/Path to equipment photo
  depositDate: {
    type: Date,
    default: Date.now,
  },
  expectedReturnDate: Date,
  actualReturnDate: Date,
  status: {
    type: String,
    enum: ['deposited', 'retrieved', 'overdue'],
    default: 'deposited',
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
depositSchema.pre('save', function() {
  if (this.status !== 'retrieved' && this.expectedReturnDate < new Date()) {
    this.status = 'overdue';
  }
});

module.exports = mongoose.model('Deposit', depositSchema);
