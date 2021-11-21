/** @format */

//Dependencies
const express = require('express');

//Controllers
const {
  createOrder,
  getOneOrder,
  getLoggedInOrder,
  adminGetAllOrders,
  adminUpdateOrder,
  adminDeleteOrder,
} = require('../controllers/orderControllers');

//import middleware
const { isLoggedIn, customRole } = require('../middlewares/userMiddleware');

//create a router instance
const router = express.Router();

/*   /api/v1/order/create   */
router.route('/order/create').post(isLoggedIn, createOrder);

/*   /api/v1/order/get/:id   */
router.route('/myorder').get(isLoggedIn, getLoggedInOrder);

/*   /api/v1/order/get/:id   */
router.route('/order/:id').get(isLoggedIn, getOneOrder);

/*****************************************ADMIN ONLY******************************************/

/*   /api/v1/admin/orders   */
router
  .route('/admin/orders ')
  .get(isLoggedIn, customRole('admin'), adminGetAllOrders);

/*   /api/v1/admin/orders   */
router
  .route('/admin/order/:id ')
  .put(isLoggedIn, customRole('admin'), adminUpdateOrder)
  .delete(isLoggedIn, customRole('admin'), adminDeleteOrder);

module.exports = router;

//PLACE THE ROUTES THAT ACCEPT ID AT THE VERY END
