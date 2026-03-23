const express = require('express');
const router = express.Router();
const { getSales, createSale } = require('../controllers/saleController');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(getSales)
  .post(createSale);

module.exports = router;
