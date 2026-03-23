const express = require('express');
const router = express.Router();
const { getDebts, getDebt, addPayment } = require('../controllers/debtController');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(getDebts);

router.route('/:id')
  .get(getDebt);

router.post('/:id/pay', addPayment);

module.exports = router;
