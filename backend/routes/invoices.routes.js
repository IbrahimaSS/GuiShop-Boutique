const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, downloadInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(getInvoices);

router.route('/:id')
  .get(getInvoice);

router.get('/:id/pdf', downloadInvoice);

module.exports = router;
