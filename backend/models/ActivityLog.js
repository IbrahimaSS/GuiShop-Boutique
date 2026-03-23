const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  entity: String, // product, sale...
  entityId: mongoose.Schema.ObjectId,
  ipAddress: String,
  details: Object,
}, {
  timestamps: true,
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
