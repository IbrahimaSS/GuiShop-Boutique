const express = require('express');
const router = express.Router();
const { getSales, createSale, validateSale } = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getSales)
  .post(authorize('admin', 'manager'), createSale);

router.patch('/:id/validate', authorize('admin'), validateSale);

module.exports = router;
