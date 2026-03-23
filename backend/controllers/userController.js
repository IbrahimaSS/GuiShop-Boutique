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

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Compte non trouvé' });
    }

    // Protection : Ne pas se supprimer soi-même
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez pas supprimer votre propre compte admin ici' });
    }

    await user.deleteOne();

    // Log deletion
    await logActivity(
      req.user._id,
      `Accès révoqué et compte supprimé : @${user.username}`,
      'User',
      user._id,
      req.ip
    );

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getUsers, createUser, deleteUser };
