const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getProducts)
  .post(authorize('admin', 'manager'), createProduct); // Gestionnaire peut AJOUTER (POST)

router.route('/:id')
  .get(authorize('admin', 'manager'), getProduct)
  .put(authorize('admin'), updateProduct)      // Seul ADMIN peut MODIFIER
  .delete(authorize('admin'), deleteProduct);   // Seul ADMIN peut SUPPRIMER

module.exports = router;
