/** @format */

//DEPENDENCIES
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const crypto = require('crypto');

//----SEND_STRIPE_API_KEY---//
exports.sendStripeKey = async (req, res, next) => {
  try {
    res.status(200).json({
      stripeKey: process.env.STRIPE_API_KEY,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//----SEND_STRIPE_PAYMENT_INSTANCE---//
exports.captureStripePayment = async (req, res, next) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'inr',
      metadata: { integration_check: 'accept_a_payment' },
    });
    res.status(200).json({
      success: true,
      client_secret: paymentIntent.client_secret,
      amount: req.body.amount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//----SEND_RAZORPAY_API_KEY---//
exports.sendRazorPayKey = async (req, res, next) => {
  try {
    res.status(200).json({
      razorpayKey: process.env.RAZORPAY_API_KEY,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//----SEND_RAZORPAY_PAYMENT_INSTANCE---//
exports.captureRazorPayPayment = async (req, res, next) => {
  try {
    let instance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });

    let options = {
      amount: req.body.amount,
      currency: 'INR',
      receipt: crypto.randomBytes(20).toString('hex'),
    };

    const myOrder = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      amount: req.body.amount,
      order: myOrder,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};
