const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const { protect, admin } = require('../middleware/auth.middleware');

router.use(protect);
router.use(admin);

router.get('/', getActivities);

module.exports = router;
