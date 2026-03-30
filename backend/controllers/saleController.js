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
    const { validationStatus } = req.query;
    const query = validationStatus ? { validationStatus } : {};
    
    const sales = await Sale.find(query).populate('createdBy', 'username fullName').sort('-createdAt');
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

    // 1. Verify and update stock (Only if Admin or Auto-approval)
    const isAdmin = req.user.role === 'admin';
    const initialValidationStatus = isAdmin ? 'approved' : 'pending';

    if (isAdmin) {
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ success: false, error: `Produit non trouvé: ${item.name}` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ success: false, error: `Stock insuffisant pour ${product.name}` });
        }

        // Price Interval Validation
        if (product.minSellingPrice && item.price < product.minSellingPrice) {
          return res.status(400).json({ success: false, error: `Le prix pour ${product.name} est trop bas (Min: ${product.minSellingPrice})` });
        }
        if (product.maxSellingPrice && item.price > product.maxSellingPrice) {
          return res.status(400).json({ success: false, error: `Le prix pour ${product.name} est trop élevé (Max: ${product.maxSellingPrice})` });
        }

        product.stock -= item.quantity;
        await product.save();
      }
    } else {
       // Check price interval even for non-admin (manager)
       for (const item of items) {
         const product = await Product.findById(item.product);
         if (product) {
            if (product.minSellingPrice && item.price < product.minSellingPrice) {
              return res.status(400).json({ success: false, error: `Le prix pour ${product.name} est trop bas (Min: ${product.minSellingPrice})` });
            }
            if (product.maxSellingPrice && item.price > product.maxSellingPrice) {
              return res.status(400).json({ success: false, error: `Le prix pour ${product.name} est trop élevé (Max: ${product.maxSellingPrice})` });
            }
         }
       }
    }

    // 2. Create Sale
    const sale = await Sale.create({
      items,
      paymentType,
      clientName,
      clientPhone,
      discount,
      status: req.body.status || 'completed', // Can be payer_livrer etc
      tax,
      subTotal,
      totalAmount,
      validationStatus: initialValidationStatus,
      createdBy: req.user.id
    });

    // 3. Automated documents (Only if approved)
    if (isAdmin) {
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

      if (paymentType === 'cash' || paymentType === 'transfer') {
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
        await Debt.create({
          clientName,
          clientPhone,
          totalAmount,
          remainingAmount: totalAmount,
          dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          products: items.map(i => i.name).join(', '),
          saleId: sale._id,
          createdBy: req.user.id
        });
      }
    }

    // Log Activity
    await logActivity(
      req.user._id, 
      `Nouvelle vente ${isAdmin ? 'enregistrée' : 'soumise pour validation'} : ${sale.totalAmount.toLocaleString()} GNF`, 
      'Sale', 
      sale._id, 
      req.ip
    );

    // Notify Admin if manager
    if (!isAdmin) {
      req.io.emit('notification', {
        title: 'Vente en attente',
        message: `${req.user.fullName} a soumis une vente de ${totalAmount.toLocaleString()} GNF pour approbation`,
        type: 'sale_pending',
        user: req.user.fullName,
        saleId: sale._id,
        time: new Date()
      });
    }

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Approve/Reject Sale
// @route   PATCH /api/sales/:id/validate
// @access  Private/Admin
const validateSale = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const sale = await Sale.findById(req.params.id).populate('items.product');

    if (!sale) {
      return res.status(404).json({ success: false, error: 'Vente non trouvée' });
    }

    if (sale.validationStatus !== 'pending') {
      return res.status(400).json({ success: false, error: 'Cette vente a déjà été traitée' });
    }

    if (status === 'approved') {
      // 1. Check & Update Stock
      for (const item of sale.items) {
        const product = await Product.findById(item.product);
        if (product.stock < item.quantity) {
          return res.status(400).json({ success: false, error: `Stock insuffisant pour ${product.name}` });
        }
        product.stock -= item.quantity;
        await product.save();
      }

      // 2. Generate Documents
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const invoiceCount = await Invoice.countDocuments();
      const invoiceNumber = `FAC-${dateStr}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

      const invoice = await Invoice.create({
        invoiceNumber,
        type: 'invoice',
        clientName: sale.clientName,
        clientPhone: sale.clientPhone,
        items: sale.items,
        totalAmount: sale.totalAmount,
        status: sale.paymentType === 'credit' ? 'pending' : 'paid',
        sale: sale._id,
        issuedBy: req.user.id
      });

      sale.invoiceId = invoice._id;
      sale.validationStatus = 'approved';

      // 3. Handle Receipt/Debt
      if (sale.paymentType === 'cash' || sale.paymentType === 'transfer') {
        const receiptNumber = `REC-${dateStr}-${(invoiceCount + 2).toString().padStart(4, '0')}`;
        await Invoice.create({
          invoiceNumber: receiptNumber,
          type: 'receipt',
          clientName: sale.clientName,
          clientPhone: sale.clientPhone,
          items: sale.items,
          totalAmount: sale.totalAmount,
          status: 'paid',
          sale: sale._id,
          issuedBy: req.user.id
        });
      } else if (sale.paymentType === 'credit') {
        await Debt.create({
          clientName: sale.clientName,
          clientPhone: sale.clientPhone,
          totalAmount: sale.totalAmount,
          remainingAmount: sale.totalAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          products: sale.items.map(i => i.name).join(', '),
          saleId: sale._id,
          createdBy: req.user.id
        });
      }
    } else {
      sale.validationStatus = 'rejected';
    }

    await sale.save();

    // Log Activity
    await logActivity(req.user._id, `Vente ${status === 'approved' ? 'approuvée' : 'rejetée'} : ${sale.saleNumber}`, 'Sale', sale._id, req.ip);

    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getSales,
  createSale,
  validateSale
};
