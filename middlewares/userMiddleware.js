/** @format */

const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.isLoggedIn = async (req, res, next) => {
  try {
    // check token first in cookies
    let token = req.cookies.token;

    // if token not found in cookies, check if header contains Auth field
    if (!token && req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '');
    }

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token not found',
      });
    }
    //retuns the decoded token through which we can accesss the constituents of the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //id can be extracted from decoded because token is made with _id
    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.customRole = (...roles) => {
  return (req, res, next) => {
    //ensures the user instance has a role that matches with the role that is a params
    if (!roles.includes(req.user.role)) {
      res.status(400).json({
        success: false,
        message: 'Only admins are allowed',
      });
    }
    next();
  };
};
