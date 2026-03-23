const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate('createdBy', 'username fullName').sort('-createdAt');
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { title, category, amount, date } = req.body;

    const expense = await Expense.create({
      title,
      category,
      amount,
      date,
      createdBy: req.user.id
    });

    // Envoyer une notification en temps réel si c'est un gestionnaire
    if (req.user && req.user.role === 'manager') {
      req.io.emit('notification', {
        title: 'Nouvelle Dépense',
        message: `${req.user.fullName} a enregistré une dépense de ${amount.toLocaleString()} GNF : ${title}`,
        type: 'expense',
        user: req.user.fullName,
        time: new Date()
      });
    }

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Dépense non trouvée' });
    }
    await expense.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense
};
