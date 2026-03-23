const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/stats', getStats);
const { getFinancialReport } = require('../controllers/dashboardController');
router.get('/report', getFinancialReport);

module.exports = router;
