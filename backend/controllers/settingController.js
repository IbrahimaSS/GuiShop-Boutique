const Setting = require('../models/Setting');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    
    if (!settings) {
      settings = await Setting.create({});
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      settings = await Setting.findByIdAndUpdate(settings._id, req.body, {
        new: true,
        runValidators: true
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Upload shop logo
// @route   POST /api/settings/upload-logo
// @access  Private/Admin
exports.uploadLogo = async (req, res) => {
  try {
    console.info("Tentative d'upload - Fichier:", req.file ? req.file.filename : 'Aucun');
    if (!req.file) {
      console.error("Aucun fichier reçu dans req.file");
      return res.status(400).json({ success: false, error: 'Veuillez télécharger une image' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({ logo: logoUrl });
    } else {
      settings.logo = logoUrl;
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
