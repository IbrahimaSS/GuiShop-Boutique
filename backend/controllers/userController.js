const User = require('../models/User');
const logActivity = require('../utils/activityLogger');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create user manually
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { username, fullName, email, password, role } = req.body;
    const user = await User.create({ username, fullName, email, password, role });

    // Log this activity
    await logActivity(
      req.user._id, 
      `Nouvel utilisateur créé : @${user.username}`, 
      'User', 
      user._id, 
      req.ip
    );

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = { getUsers, createUser };
