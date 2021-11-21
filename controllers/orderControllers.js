/** @format */

//internal imports
const Order = require('../models/Order');
const Product = require('../models/Product');

//-----CREATE_ORDER CONTROLLER ----//
exports.createOrder = async (req, res, next) => {
  try {
    //extract from the request body
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      taxAmount,
      shippingAmount,
      totalAmount,
    } = req.body;
    //create an order in the db
    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      taxAmount,
      shippingAmount,
      totalAmount,
      user: req.user._id, //comes from middleware injection
    });
    //send the order
    res.status(200).json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//-----GET_ORDER CONTROLLER ----//
exports.getOneOrder = async (req, res, next) => {
  try {
    //populate can be auto drill to expand the foreign key fields
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) {
      //order not exists
      res.status(400).json({
        success: false,
        message: 'No such order exists',
      });
    }
    //success message
    res.status(200).json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//-----GET_ALL_ORDERS_LOGGED_IN CONTROLLER ----//
exports.getLoggedInOrder = async (req, res, next) => {
  try {
    const order = await Order.find({ user: req.user._id });
    if (!order) {
      //order not exists
      res.status(400).json({
        success: false,
        message: 'No such order exists',
      });
    }
    //success message
    res.status(200).json({
      success: true,
      order: order,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_GET_ALL_ORDERS CONTROLLER ----//
exports.adminGetAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find();

    //success message
    res.status(200).json({
      success: true,
      orders: orders,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_UPDATE_ORDERS CONTROLLER ----//
exports.adminUpdateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order.orderStatus === 'Delivered') {
      res.status(400).json({
        success: false,
        message: 'Order is already delivered',
      });
    }
    order.orderStatus = req.body.orderStatus;
    order.orderItems.forEach(async (prod) => {
      await updateProductStock(prod.product, prod.quantity);
    });
    await order.save();
    res.status(200).json({
      success: true,
      message: `Order status changed to ${order.orderStatus}`,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//function to update stock
async function updateProductStock(productId, quantity) {
  const product = await Product.findById(productId);
  product.stock = product.stock - quantity;
  await product.save({ validateBeforeSave: false });
}

//-----ADMIN_DELETE_ORDERS CONTROLLER ----//
exports.adminDeleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    await order.remove();
    res.status(200).json({
      success: true,
      message: `Order deleted`,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};
