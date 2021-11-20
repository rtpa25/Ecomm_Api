/** @format */

//Dependencies
const express = require('express');

//Controllers
const {
  addProduct,
  getAllProduct,
  getOneProduct,
  getAllProductsAdmin,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

//import middleware
const { isLoggedIn, customRole } = require('../middlewares/userMiddleware');

//create a router instance
const router = express.Router();

/*****************************************USER ROUTES******************************************/
/*   /api/v1/demo   */
router.route('/demo').get();

/*   /api/v1/products   */
router.route('/products').get(getAllProduct);

/*   /api/v1/product/:id  */
router.route('/product/:id').get(getOneProduct);

/*****************************************ADMIN ONLY******************************************/

/*   /api/v1/admin/product/add   */
router
  .route('/admin/product/add')
  .post(isLoggedIn, customRole('admin'), addProduct);

/*   /api/v1/admin/products   */
router
  .route('/admin/products')
  .get(isLoggedIn, customRole('admin'), getAllProductsAdmin);

/*   /api/v1/admin/product/:id   */
router
  .route('/admin/product/:id')
  .put(isLoggedIn, customRole('admin'), updateProduct)
  .delete(isLoggedIn, customRole('admin'), deleteProduct);

module.exports = router;
