const express = require('express');
const { getSettings, updateSettings, uploadLogo } = require('../controllers/settingController');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', getSettings);
router.put('/', protect, authorize('admin'), updateSettings);
router.post('/logo', protect, authorize('admin'), upload.single('logo'), uploadLogo);

module.exports = router;
