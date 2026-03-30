const StockRequest = require('../models/StockRequest');
const Product = require('../models/Product');
const logActivity = require('../utils/activityLogger');

// @desc    Get all stock requests
// @route   GET /api/stock-requests
// @access  Private/Admin
const getStockRequests = async (req, res) => {
  try {
    const requests = await StockRequest.find()
      .populate('product', 'name stock')
      .populate('requestedBy', 'username fullName')
      .sort('-createdAt');
    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Approve/Reject stock request
// @route   PATCH /api/stock-requests/:id/validate
// @access  Private/Admin
const validateStockRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const stockRequest = await StockRequest.findById(req.params.id);

    if (!stockRequest) {
      return res.status(404).json({ success: false, error: 'Demande non trouvée' });
    }

    if (stockRequest.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Cette demande a déjà été traitée' });
    }

    if (status === 'approved') {
      const product = await Product.findById(stockRequest.product);
      if (product) {
        product.stock += stockRequest.quantity;
        await product.save();
      }
      stockRequest.status = 'approved';
    } else {
      stockRequest.status = 'rejected';
    }

    stockRequest.validatedBy = req.user.id;
    stockRequest.validatedAt = Date.now();
    await stockRequest.save();

    // Notify Manager (Real-time)
    if (req.io) {
      const product = await Product.findById(stockRequest.product);
      req.io.emit('notification', {
        title: status === 'approved' ? 'Stock Approuvé ✅' : 'Stock Refusé ❌',
        message: `La demande de ${stockRequest.quantity} unités pour ${product?.name} a été ${status === 'approved' ? 'acceptée' : 'rejetée'}.`,
        type: status === 'approved' ? 'success' : 'error',
        time: new Date()
      });
    }

    // Log Activity
    await logActivity(req.user._id, `Demande de stock ${status === 'approved' ? 'approuvée' : 'rejetée'} pour ${stockRequest.product}`, 'StockRequest', stockRequest._id, req.ip);

    res.json({ success: true, data: stockRequest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getStockRequests,
  validateStockRequest
};
