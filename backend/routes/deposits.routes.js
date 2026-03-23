const express = require('express');
const router = express.Router();
const { getDeposits, createDeposit, retrieveDeposit } = require('../controllers/depositController');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect);

router.route('/')
  .get(getDeposits)
  .post(upload.single('photo'), createDeposit);

router.put('/:id/retrieve', retrieveDeposit);

module.exports = router;
