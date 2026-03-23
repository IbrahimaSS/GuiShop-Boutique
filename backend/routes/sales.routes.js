const express = require('express');
const router = express.Router();
const { getSales, createSale } = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getSales)
  .post(authorize('admin', 'manager'), createSale);

module.exports = router;
