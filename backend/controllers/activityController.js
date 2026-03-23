const ActivityLog = require('../models/ActivityLog');

// @desc    Get all activity logs
// @route   GET /api/activities
// @access  Private/Admin
const getActivities = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('userId', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getActivities };
