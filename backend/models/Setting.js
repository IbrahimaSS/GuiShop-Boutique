const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  shopName: {
    type: String,
    default: 'Projet GB'
  },
  location: {
    type: String,
    default: 'Madina Marché, Conakry'
  },
  contactPhone: {
    type: String,
    default: '+224 620 00 00 00'
  },
  currency: {
    type: String,
    default: 'GNF'
  },
  logo: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Setting', settingSchema);
