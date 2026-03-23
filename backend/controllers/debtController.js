const Debt = require('../models/Debt');
const Invoice = require('../models/Invoice');

// @desc    Get all debts
// @route   GET /api/debts
// @access  Private
const getDebts = async (req, res) => {
  try {
    const debts = await Debt.find().populate('createdBy', 'username fullName').sort('-createdAt');
    res.json({ success: true, count: debts.length, data: debts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single debt
// @route   GET /api/debts/:id
// @access  Private
const getDebt = async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id).populate('createdBy', 'username fullName');
    if (!debt) {
      return res.status(404).json({ success: false, error: 'Dette non trouvée' });
    }
    res.json({ success: true, data: debt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add payment for debt
// @route   POST /api/debts/:id/pay
// @access  Private
const addPayment = async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt) {
      return res.status(404).json({ success: false, error: 'Dette non trouvée' });
    }

    const { amount, paymentMethod, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide' });
    }

    if (amount > debt.remainingAmount) {
      return res.status(400).json({ success: false, error: `Le montant payé dépasse le reste dû (${debt.remainingAmount})` });
    }

    // 1. Generate Receipt document
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceCount = await Invoice.countDocuments();
    const receiptNumber = `REC-DEBT-${dateStr}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

    const receipt = await Invoice.create({
      invoiceNumber: receiptNumber,
      type: 'receipt',
      clientName: debt.clientName,
      clientPhone: debt.clientPhone,
      items: [{ name: `Paiement dette - ${debt.products}`, qty: 1, unitPrice: amount, total: amount }],
      totalAmount: amount,
      status: 'paid',
      issuedBy: req.user.id
    });

    // 2. Add payment to history
    debt.payments.push({
      amount,
      paymentMethod,
      note,
      receiptId: receipt._id,
      receivedBy: req.user.id,
      paidAt: Date.now()
    });

    // 3. Update debt remaining amount properly
    // We use debt.remainingAmount = debt.remainingAmount - amount to be safe
    const newRemaining = debt.remainingAmount - amount;
    debt.remainingAmount = newRemaining;
    
    // Explicitly update status if needed (middleware handles this but let's be safe)
    if (newRemaining <= 0) {
      debt.status = 'paid';
    } else if (newRemaining < debt.totalAmount) {
      debt.status = 'partially_paid';
    }

    await debt.save();

    // Link receipt back to payment (re-fetch needed if you want it exact inside the model, but mongo can ID it from receiptId)

    res.json({ success: true, data: debt, receipt });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDebts,
  getDebt,
  addPayment
};
