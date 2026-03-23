const Sale = require('../models/Sale');
const Debt = require('../models/Debt');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const { generateFinancialReport } = require('../utils/reportGenerator');
const path = require('path');
const fs = require('fs');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const today = new Date().setHours(0,0,0,0);

    // Today's Sales
    const todaySales = await Sale.find({ createdAt: { $gte: today } });
    const todayRevenue = todaySales.reduce((acc, sale) => acc + sale.totalAmount, 0);

    // Total Debts (remaining)
    const debts = await Debt.find({ status: { $ne: 'paid' } });
    const totalRemainingDebt = debts.reduce((acc, debt) => acc + debt.remainingAmount, 0);

    // Total Expenses
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthExpenses = await Expense.find({ date: { $gte: monthStart } });
    const totalMonthExpenses = monthExpenses.reduce((acc, exp) => acc + exp.amount, 0);

    // Low Stock Alert
    const lowStockCount = await Product.countDocuments({ status: { $ne: 'in_stock' } });

    // Recent Sales for feed
    const recentSales = await Sale.find().sort('-createdAt').limit(5).populate('createdBy', 'username fullName');

    res.json({
      success: true,
      data: {
        todayRevenue,
        totalRemainingDebt,
        totalMonthExpenses,
        lowStockCount,
        recentSalesCount: todaySales.length,
        recentSales
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFinancialReport = async (req, res) => {
  try {
    const sales = await Sale.find();
    const totalRevenue = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
    
    const debts = await Debt.find({ status: { $ne: 'paid' } });
    const totalDebts = debts.reduce((acc, debt) => acc + (debt.remainingAmount || 0), 0);
    
    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    
    const reportPath = await generateFinancialReport({
      totalRevenue,
      totalDebts,
      totalExpenses
    });
    
    res.download(reportPath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getStats, getFinancialReport };
