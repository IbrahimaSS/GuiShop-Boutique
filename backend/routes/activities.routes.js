const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('admin')); // Seul l'admin voit les logs

router.get('/', getActivities);

module.exports = router;
