const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, downloadInvoice, deleteInvoice } = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getInvoices);

router.route('/:id')
  .get(authorize('admin', 'manager'), getInvoice)
  .delete(authorize('admin'), deleteInvoice);

router.get('/:id/pdf', authorize('admin', 'manager'), downloadInvoice);

module.exports = router;
