const Sale = require('../models/Sale');
const Product = require('../models/Product');
const logActivity = require('../utils/activityLogger');
const Invoice = require('../models/Invoice');
const Debt = require('../models/Debt');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate('createdBy', 'username fullName').sort('-createdAt');
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res) => {
  try {
    const { items, paymentType, clientName, clientPhone, discount, tax, subTotal, totalAmount, dueDate } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'La vente doit contenir au moins un article' });
    }

    // 1. Verify and update stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, error: `Produit non trouvé: ${item.name}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, error: `Stock insuffisant pour ${product.name} (Restant: ${product.stock})` });
      }
      
      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    // 2. Create Sale
    const sale = await Sale.create({
      items,
      paymentType,
      clientName,
      clientPhone,
      discount,
      tax,
      subTotal,
      totalAmount,
      createdBy: req.user.id
    });

    // 3. Automated documents
    
    // Generate Invoice Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `FAC-${dateStr}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      type: 'invoice',
      clientName,
      clientPhone,
      items,
      totalAmount,
      status: paymentType === 'credit' ? 'pending' : 'paid',
      sale: sale._id,
      issuedBy: req.user.id
    });

    sale.invoiceId = invoice._id;
    await sale.save();

    // Log this activity
    await logActivity(
      req.user._id, 
      `Nouvelle vente réalisée : ${sale.totalAmount.toLocaleString()} GNF`, 
      'Sale', 
      sale._id, 
      req.ip
    );

    // 4. Handle Receipts & Debts
    if (paymentType === 'cash' || paymentType === 'transfer') {
      // Generate Receipt
      const receiptNumber = `REC-${dateStr}-${(invoiceCount + 2).toString().padStart(4, '0')}`;
      await Invoice.create({
        invoiceNumber: receiptNumber,
        type: 'receipt',
        clientName,
        clientPhone,
        items,
        totalAmount,
        status: 'paid',
        sale: sale._id,
        issuedBy: req.user.id
      });
    } else if (paymentType === 'credit') {
      // Create Debt
      await Debt.create({
        clientName,
        clientPhone,
        totalAmount,
        remainingAmount: totalAmount,
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        products: items.map(i => i.name).join(', '),
        saleId: sale._id,
        createdBy: req.user.id
      });
    }

    // Envoyer une notification en temps réel si c'est un gestionnaire
    if (req.user && req.user.role === 'manager') {
      req.io.emit('notification', {
        title: 'Nouvelle Vente',
        message: `${req.user.fullName} a effectué une vente de ${totalAmount.toLocaleString()} GNF`,
        type: 'sale',
        user: req.user.fullName,
        time: new Date()
      });
    }

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getSales,
  createSale
};
