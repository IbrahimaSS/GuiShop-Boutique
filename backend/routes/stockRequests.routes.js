const express = require('express');
const router = express.Router();
const { getStockRequests, validateStockRequest } = require('../controllers/stockRequestController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', authorize('admin'), getStockRequests);
router.patch('/:id/validate', authorize('admin'), validateStockRequest);

module.exports = router;
