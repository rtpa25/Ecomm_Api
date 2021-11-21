/** @format */

//Dependencies
const express = require('express');

//Controllers
const {
  sendStripeKey,
  sendRazorPayKey,
  captureStripePayment,
  captureRazorPayPayment,
} = require('../controllers/paymentController');

//import middleware
const { isLoggedIn } = require('../middlewares/userMiddleware');

//create a router instance
const router = express.Router();

/*   /api/v1/stripekey   */
router.route('/stripekey').get(isLoggedIn, sendStripeKey);

/*   /api/v1/razorpaykey   */
router.route('/razorpaykey').get(isLoggedIn, sendRazorPayKey);

/*   /api/v1/captureStripePayment   */
router.route('/captureStripePayment').post(isLoggedIn, captureStripePayment);

/*   /api/v1/captureRazorPayPayment   */
router
  .route('/captureRazorPayPayment')
  .post(isLoggedIn, captureRazorPayPayment);

module.exports = router;
