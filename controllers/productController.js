/** @format */

//internal imports
const Product = require('../models/Product');

exports.demo = async (req, res, next) => {
  res.status(200).json({
    sucess: true,
    message: 'route set-up sucess',
  });
};
