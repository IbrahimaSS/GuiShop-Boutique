const Invoice = require('../models/Invoice');
const path = require('path');
const { generatePDF } = require('../utils/pdfGenerator');

// @desc    Get all invoices/receipts
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('sale')
      .populate('debtPayment')
      .populate('issuedBy', 'username fullName')
      .sort('-createdAt');
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('sale')
      .populate('debtPayment')
      .populate('issuedBy', 'username fullName');

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Document non trouvé' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Download PDF version of invoice
// @route   GET /api/invoices/:id/pdf
// @access  Private
const downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('sale');
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Document non trouvé' });
    }

    const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
    const filePath = path.join(__dirname, '../uploads', fileName);

    // Ensure uploads dir exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!require('fs').existsSync(uploadsDir)) {
      require('fs').mkdirSync(uploadsDir, { recursive: true });
    }

    // Merge sale items if items are empty on invoice
    const pdfData = {
      ...invoice.toObject(),
      issuedAt: invoice.createdAt,
      items: invoice.items?.length > 0 ? invoice.items : (invoice.sale?.items || [])
    };

    await generatePDF(pdfData, filePath);

    res.download(filePath, fileName);
  } catch (error) {
    console.error('[PDF Download Error]:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Document non trouvé' });
    }
    await invoice.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  downloadInvoice,
  deleteInvoice
};
