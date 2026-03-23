const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getExpenses)
  .post(authorize('admin', 'manager'), createExpense);

router.route('/:id')
  .delete(authorize('admin'), deleteExpense); // Seul l'Admin peut supprimer une dépense

module.exports = router;
