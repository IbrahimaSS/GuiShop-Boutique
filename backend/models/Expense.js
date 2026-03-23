const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Une description ou un titre est requis'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['transport', 'marketing', 'shop_fees', 'salaries', 'rent', 'utilities', 'other', 'Boutique', 'Transport', 'Marketing', 'Loyer', 'Salaire', 'Electricité/Eau', 'Autre'],
    default: 'other',
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  receipt: String, // URL/Path to receipt image
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Expense', expenseSchema);
