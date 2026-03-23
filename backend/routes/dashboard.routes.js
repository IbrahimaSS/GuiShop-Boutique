const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/stats', authorize('admin', 'manager'), getStats);
const { getFinancialReport } = require('../controllers/dashboardController');
router.get('/report', authorize('admin', 'manager'), getFinancialReport);

module.exports = router;
