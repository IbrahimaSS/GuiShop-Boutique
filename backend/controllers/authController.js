const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/activityLogger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (or Admin only depending on logic)
const register = async (req, res) => {
  try {
    const { username, fullName, email, password, role } = req.body;
    const user = await User.create({
      username,
      fullName,
      email,
      password,
      role
    });

    const token = generateToken(user._id);

    // Log this activity
    await logActivity(user._id, `Inscription nouvel utilisateur : @${user.username}`, 'User', user._id, req.ip);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.info(`[DEBUG-LOGIN] Tentative pour: ${username}`);

    // Check for user (by username OR email)
    const user = await User.findOne({ 
      $or: [
        { username: username }, 
        { email: username }
      ] 
    }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    // Log this activity
    await logActivity(user._id, `Connexion utilisateur : @${user.username}`, 'Auth', user._id, req.ip);

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone, address, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (currentPassword && newPassword) {
      if (!(await user.matchPassword(currentPassword))) {
        return res.status(401).json({ success: false, error: 'Ancien mot de passe incorrect' });
      }
      user.password = newPassword;
    }

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();
    
    // Log this activity
    await logActivity(user._id, `Modification du profil : @${user.username}`, 'User', user._id, req.ip);

    res.json({
      success: true,
      user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Upload user avatar
// @route   POST /api/auth/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'S’il vous plaît veuillez télécharger un fichier' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: { 
        id: user._id, 
        username: user.username, 
        fullName: user.fullName, 
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

module.exports = { register, login, getMe, updateProfile, uploadAvatar };
