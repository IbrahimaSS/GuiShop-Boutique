const Deposit = require('../models/Deposit');

// @desc    Get all deposits
// @route   GET /api/deposits
// @access  Private
const getDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().populate('createdBy', 'username fullName').sort('-createdAt');
    res.json({ success: true, count: deposits.length, data: deposits });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new deposit item
// @route   POST /api/deposits
// @access  Private
const createDeposit = async (req, res) => {
  try {
    const { itemName, ownerName, ownerPhone, expectedReturnDate, description } = req.body;

    // Handle photo if uploaded
    let photo = '';
    if (req.file) {
      photo = `/uploads/${req.file.filename}`;
    }

    const deposit = await Deposit.create({
      itemName,
      ownerName,
      ownerPhone,
      expectedReturnDate,
      description,
      photo,
      createdBy: req.user.id
    });

    // Envoyer une notification en temps réel si c'est un gestionnaire
    if (req.user && req.user.role === 'manager') {
      req.io.emit('notification', {
        title: 'Nouveau Dépôt',
        message: `${req.user.fullName} a reçu un objet en dépôt : ${deposit.itemName}`,
        type: 'deposit',
        user: req.user.fullName,
        time: new Date()
      });
    }

    res.status(201).json({ success: true, data: deposit });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Retrieve deposit item (mark as retrieved)
// @route   PUT /api/deposits/:id/retrieve
// @access  Private
const retrieveDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ success: false, error: 'Dépôt non trouvé' });
    }

    deposit.status = 'retrieved';
    deposit.actualReturnDate = Date.now();
    await deposit.save();

    // Envoyer une notification en temps réel si c'est un gestionnaire
    if (req.user && req.user.role === 'manager') {
      req.io.emit('notification', {
        title: 'Retrait de Dépôt',
        message: `${req.user.fullName} a marqué comme retiré : ${deposit.itemName}`,
        type: 'deposit-retrieval',
        user: req.user.fullName,
        time: new Date()
      });
    }

    res.json({ success: true, data: deposit });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDeposits,
  createDeposit,
  retrieveDeposit
};
