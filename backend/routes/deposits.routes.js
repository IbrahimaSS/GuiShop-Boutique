const express = require('express');
const router = express.Router();
const { getDeposits, createDeposit, retrieveDeposit } = require('../controllers/depositController');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getDeposits)
  .post(authorize('admin', 'manager'), upload.single('photo'), createDeposit);

router.put('/:id/retrieve', authorize('admin', 'manager'), retrieveDeposit);

module.exports = router;
