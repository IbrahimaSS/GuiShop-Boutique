const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(admin, createProduct);

router.route('/:id')
  .get(getProduct)
  .put(admin, updateProduct)
  .delete(admin, deleteProduct);

module.exports = router;
