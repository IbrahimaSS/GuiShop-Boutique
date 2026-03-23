const Product = require('../models/Product');
const logActivity = require('../utils/activityLogger');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('createdBy', 'username fullName');
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single product by ID or barcode
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res) => {
  try {
    let product;
    // Check if ID or barcode
    if (req.params.id.length > 20) {
      product = await Product.findById(req.params.id);
    } else {
      product = await Product.findOne({ barcode: req.params.id });
    }

    if (!product) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const product = await Product.create(req.body);
    
    // Log Activity
    await logActivity(req.user._id, `Produit créé : ${product.name}`, 'Product', product._id, req.ip);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
       return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Log Activity
    await logActivity(req.user._id, `Produit modifié : ${product.name}`, 'Product', product._id, req.ip);

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
       return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }
    await product.deleteOne();

    // Log Activity
    await logActivity(req.user._id, `Produit supprimé : ${product.name}`, 'Product', product._id, req.ip);

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
