const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  requestStockUpdate
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'manager'), getProducts)
  .post(authorize('admin'), createProduct); // Seul ADMIN peut AJOUTER (POST)

router.route('/:id')
  .get(authorize('admin', 'manager'), getProduct)
  .put(authorize('admin'), updateProduct)      // Seul ADMIN peut MODIFIER
  .delete(authorize('admin'), deleteProduct);   // Seul ADMIN peut SUPPRIMER

router.post('/:id/request-stock', authorize('manager'), requestStockUpdate);

module.exports = router;
