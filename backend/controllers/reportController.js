const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const StockRequest = require('../models/StockRequest');

// @desc    Get Bilan (General or per Product)
// @route   GET /api/reports/bilan
// @access  Private/Admin
const ActivityLog = require('../models/ActivityLog');

const getBilan = async (req, res) => {
  try {
    const { timeframe, productId } = req.query;

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    if (timeframe === 'monthly') startDate.setDate(1);
    else if (timeframe === 'yearly') startDate.setMonth(0, 1);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // 1. Stock Metrics (Always current)
    const allProducts = await Product.find(productId ? { _id: productId } : {});
    const totalStockValue = allProducts.reduce((acc, p) => {
      const unitCost = (p.purchasePrice || 0) + (p.transportFees || 0) + (p.handlingFees || 0);
      return acc + (p.stock * unitCost);
    }, 0);
    const totalPotentialSales = allProducts.reduce((acc, p) => acc + (p.stock * (p.maxSellingPrice || 0)), 0);
    const totalItemsInStock = allProducts.reduce((acc, p) => acc + p.stock, 0);

    // 2. Sales & Profits
    let salesQuery = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    let sales = await Sale.find(salesQuery).populate('items.product').populate('createdBy', 'fullName');

    if (productId) {
      sales = sales.filter(s => s.items.some(item => item.product && item.product._id.toString() === productId));
    }

    const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const pendingSalesCount = 0; // Plus d'attente avec le nouveau flux

    // 3. Expenses
    const expenses = await Expense.find({ date: { $gte: startDate, $lte: endDate } });
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // 4. Activity Logs (Entries/Exits)
    const logQuery = productId ? {
      $or: [
        { entityId: productId },
        ...(allProducts[0] ? [{ action: new RegExp(allProducts[0].name, 'i') }] : [])
      ]
    } : {};

    const activities = await ActivityLog.find(logQuery)
      .sort('-createdAt')
      .limit(10)
      .populate('userId', 'fullName');

    // 5. Summary Map for Charts
    let totalProfit = 0;
    const summaryMap = {};
    for (const sale of sales) {
      // Les ventes sont maintenant validées par défaut

      const dateStr = sale.createdAt.toISOString().split('T')[0];
      if (!summaryMap[dateStr]) summaryMap[dateStr] = { date: dateStr, total: 0, profit: 0 };

      summaryMap[dateStr].total += sale.totalAmount;

      for (const item of sale.items) {
        if (productId && item.product?._id?.toString() !== productId) continue;
        if (item.product) {
          const unitCost = (item.product.purchasePrice || 0) + (item.product.transportFees || 0) + (item.product.handlingFees || 0);
          const profit = (item.price - unitCost) * item.quantity;
          totalProfit += profit;
          summaryMap[dateStr].profit += profit;
        }
      }
    }

    const summary = Object.values(summaryMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        totalSales,
        totalExpenses,
        totalProfit,
        totalStockValue,
        totalPotentialSales,
        totalItemsInStock,
        pendingSalesCount,
        balance: totalSales - totalExpenses,
        summary,
        activities: activities.map(a => ({
          type: (a.entity || 'activity').toLowerCase(),
          action: a.action,
          date: a.createdAt,
          user: a.userId?.fullName || 'Manager'
        }))
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getBilan
};
