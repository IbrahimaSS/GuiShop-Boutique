const express = require('express');
const router = express.Router();
const { getDebts, getDebt, addPayment } = require('../controllers/debtController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getDebts);

router.route('/:id')
  .get(authorize('admin', 'manager'), getDebt);

router.post('/:id/pay', authorize('admin', 'manager'), addPayment);

module.exports = router;
