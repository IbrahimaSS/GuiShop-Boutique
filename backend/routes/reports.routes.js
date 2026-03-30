const express = require('express');
const router = express.Router();
const { getBilan } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/bilan', authorize('admin'), getBilan);

module.exports = router;
